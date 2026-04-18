import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";
import { verifyQrToken } from "@/lib/services/qr-token.service";
import {
  signCustomerJwt,
  hashToken,
  CUSTOMER_SESSION_TTL_SECONDS,
  RECEIPT_SCOPE_TTL_SECONDS,
  type CustomerScope,
} from "@/lib/auth/customer-session";

/**
 * Lógica de vida de sesión del comensal.
 *
 * - `startSession`  invocada desde POST /api/session/start tras validar QR.
 * - `revokeSession` para logout explícito o rotación post-pago.
 * - `rotateToReceiptScope` emite nuevo JWT con scope 'receipt:<paymentId>'
 *   y TTL 15min una vez confirmado el pago.
 *
 * Todas las ops respetan el check de `restaurant.is_active` — no emitimos
 * sesión contra un restaurante pausado.
 */

export interface StartSessionInput {
  slug: string;
  tableId: string;
  qrToken: string;
  qrVersion: number;
  userAgent?: string;
  ip?: string;
}

export interface StartSessionResult {
  sessionId: string;
  token: string;
  expiresAt: Date;
  restaurant: {
    id: string;
    slug: string;
    name: string;
    primary_color: string;
    secondary_color: string;
    background_color: string;
    logo_url: string | null;
  };
  table: {
    id: string;
    number: number;
    label: string | null;
  };
}

export async function startSession(
  input: StartSessionInput
): Promise<StartSessionResult> {
  // 1. Restaurant + mesa existen, activos y consistentes con el QR.
  const table = await db.table.findUnique({
    where: { id: input.tableId },
    include: {
      restaurants: {
        select: {
          id: true,
          slug: true,
          name: true,
          primary_color: true,
          secondary_color: true,
          background_color: true,
          logo_url: true,
          is_active: true,
        },
      },
      qr_codes: { select: { token_version: true, is_active: true } },
    },
  });

  if (!table) {
    throw new AppError("Mesa no encontrada", 404, "TABLE_NOT_FOUND");
  }
  if (!table.is_active) {
    throw new AppError("Mesa inactiva", 404, "TABLE_NOT_FOUND");
  }
  if (table.restaurants.slug !== input.slug) {
    // Slug/tableId no coinciden — no revelar a atacante qué está mal.
    throw new AppError("Mesa no encontrada", 404, "TABLE_NOT_FOUND");
  }
  if (!table.restaurants.is_active) {
    throw new AppError(
      "Este restaurante está pausado temporalmente. Paga al mesero.",
      403,
      "RESTAURANT_INACTIVE"
    );
  }

  // 2. QR debe existir y estar activo (la relación table↔qr_codes es 1:1).
  const qr = table.qr_codes;
  if (!qr || !qr.is_active) {
    throw new AppError("QR inválido o desactivado", 401, "QR_INVALID");
  }

  // 3. Versión presentada coincide con la actual.
  if (input.qrVersion !== qr.token_version) {
    throw new AppError("Versión de QR obsoleta", 401, "QR_INVALID");
  }

  // 4. HMAC del token coincide con el payload esperado.
  const ok = verifyQrToken(input.qrToken, input.tableId, input.qrVersion);
  if (!ok) {
    throw new AppError("Firma de QR inválida", 401, "QR_INVALID");
  }

  // 5. Emisión: INSERT sessions + sign JWT.
  //    El token_hash es SHA256 del JWT firmado. Como la generación del JWT
  //    depende del sessionId (sid claim), firmamos primero con un UUID
  //    provisional, calculamos hash, y luego insert con ese hash y el
  //    sessionId real — no: el sid va en los claims, así que primero
  //    creamos el row para obtener el id (gen_random_uuid() default), y
  //    luego firmamos con ese sid y hacemos UPDATE del token_hash.
  //
  //    Esto requiere 2 roundtrips pero mantiene sid consistente.

  const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_TTL_SECONDS * 1000);

  // Paso 5a: INSERT con token_hash temporal único (el id todavía no lo
  // conocemos, pero el insert retorna el uuid generado). Usamos una marca
  // aleatoria temporal para cumplir el UNIQUE y luego actualizamos.
  const provisionalHash = `pending:${crypto.randomUUID()}`;
  const row = await db.session.create({
    data: {
      table_id: input.tableId,
      restaurant_id: table.restaurants.id,
      token_hash: provisionalHash,
      scope: "table",
      user_agent: input.userAgent ?? null,
      ip: input.ip ?? null,
      expires_at: expiresAt,
    },
  });

  // Paso 5b: firmar JWT con el sid real.
  const scope: CustomerScope = `table:${input.tableId}`;
  const token = await signCustomerJwt({
    sid: row.id,
    scope,
    rid: table.restaurants.id,
    tid: input.tableId,
  });

  // Paso 5c: actualizar el row con el hash real.
  const tokenHash = hashToken(token);
  await db.session.update({
    where: { id: row.id },
    data: { token_hash: tokenHash },
  });

  return {
    sessionId: row.id,
    token,
    expiresAt,
    restaurant: {
      id: table.restaurants.id,
      slug: table.restaurants.slug,
      name: table.restaurants.name,
      primary_color: table.restaurants.primary_color,
      secondary_color: table.restaurants.secondary_color,
      background_color: table.restaurants.background_color,
      logo_url: table.restaurants.logo_url,
    },
    table: {
      id: table.id,
      number: table.table_number,
      label: table.label,
    },
  };
}

/**
 * Marca una sesión como revocada. Idempotente (si ya está revocada, no-op).
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

/**
 * Rota una sesión activa a scope 'receipt:<paymentId>' con TTL 15min.
 *
 * Usado post-pago: el JWT original de scope table se revoca y se emite
 * uno nuevo reducido que solo permite leer el comprobante. Evita que un
 * JWT viejo siga dando acceso al bill y re-pago.
 */
export async function rotateToReceiptScope(params: {
  sessionId: string;
  paymentId: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const current = await db.session.findUnique({
    where: { id: params.sessionId },
    include: { restaurants: { select: { id: true, is_active: true } } },
  });

  if (!current) {
    throw new AppError("Sesión no encontrada", 404, "SESSION_INVALID");
  }
  if (!current.restaurants.is_active) {
    throw new AppError(
      "Restaurante inactivo",
      403,
      "RESTAURANT_INACTIVE"
    );
  }

  // Revocar el actual y crear uno nuevo con scope receipt.
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RECEIPT_SCOPE_TTL_SECONDS * 1000);

  const provisionalHash = `pending:${crypto.randomUUID()}`;
  const newRow = await db.session.create({
    data: {
      table_id: current.table_id,
      restaurant_id: current.restaurant_id,
      token_hash: provisionalHash,
      scope: "receipt",
      payment_id: params.paymentId,
      user_agent: current.user_agent,
      ip: current.ip,
      expires_at: expiresAt,
    },
  });

  const scope: CustomerScope = `receipt:${params.paymentId}`;
  const token = await signCustomerJwt({
    sid: newRow.id,
    scope,
    rid: current.restaurant_id,
    tid: current.table_id,
    ttlSeconds: RECEIPT_SCOPE_TTL_SECONDS,
  });

  const tokenHash = hashToken(token);
  await db.session.update({
    where: { id: newRow.id },
    data: { token_hash: tokenHash },
  });

  // Revocar el JWT anterior.
  await revokeSession(params.sessionId);

  return { token, expiresAt };
}
