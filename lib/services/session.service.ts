import crypto from "node:crypto";
import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";
import { verifyQrToken } from "@/lib/services/qr-token.service";
import {
  signCustomerJwt,
  hashToken,
  assertRestaurantOperational,
  CUSTOMER_SESSION_TTL_SECONDS,
  RECEIPT_SCOPE_TTL_SECONDS,
  type CustomerScope,
} from "@/lib/auth/customer-session";

// Ciclo de vida de sesión del comensal: start (tras QR), revoke, rotate a
// scope receipt post-pago. Todas validan restaurant.is_active vía helper.

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

  // "TABLE_NOT_FOUND" genérico para todos los 404 para no servir de oráculo
  // de enumeración (mesa inexistente vs inactiva vs slug mismatch).
  if (!table || !table.is_active || table.restaurants.slug !== input.slug) {
    throw new AppError("Mesa no encontrada", 404, "TABLE_NOT_FOUND");
  }

  assertRestaurantOperational(table.restaurants);

  const qr = table.qr_codes;
  if (!qr || !qr.is_active) {
    throw new AppError("QR inválido o desactivado", 401, "QR_INVALID");
  }
  if (input.qrVersion !== qr.token_version) {
    throw new AppError("Versión de QR obsoleta", 401, "QR_INVALID");
  }
  if (!verifyQrToken(input.qrToken, input.tableId, input.qrVersion)) {
    throw new AppError("Firma de QR inválida", 401, "QR_INVALID");
  }

  // Pre-generar el id para firmar el JWT y hacer el INSERT en 1 query.
  // Antes: insert con hash dummy → firmar con row.id → update. 2 queries
  // y ventana en la que el row existía con un token_hash inválido.
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_TTL_SECONDS * 1000);
  const scope: CustomerScope = `table:${input.tableId}`;

  const token = await signCustomerJwt({
    sid: sessionId,
    scope,
    rid: table.restaurants.id,
    tid: input.tableId,
  });

  await db.session.create({
    data: {
      id: sessionId,
      table_id: input.tableId,
      restaurant_id: table.restaurants.id,
      token_hash: hashToken(token),
      scope: "table",
      user_agent: input.userAgent ?? null,
      ip: input.ip ?? null,
      expires_at: expiresAt,
    },
  });

  return {
    sessionId,
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

/** Idempotente: si ya está revocada, no-op. */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

/**
 * Post-pago: revoca la sesión table y emite una nueva con scope
 * 'receipt:<paymentId>' (TTL 15min) para que el JWT viejo no siga
 * dando acceso al bill.
 */
export async function rotateToReceiptScope(params: {
  sessionId: string;
  paymentId: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const current = await db.session.findUnique({
    where: { id: params.sessionId },
    include: { restaurants: { select: { is_active: true } } },
  });

  if (!current) {
    throw new AppError("Sesión no encontrada", 404, "SESSION_INVALID");
  }
  if (current.revoked_at || current.expires_at.getTime() <= Date.now()) {
    throw new AppError("Sesión no elegible para rotación", 400, "SESSION_INVALID");
  }
  assertRestaurantOperational(current.restaurants);

  const newSessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RECEIPT_SCOPE_TTL_SECONDS * 1000);
  const scope: CustomerScope = `receipt:${params.paymentId}`;

  const token = await signCustomerJwt({
    sid: newSessionId,
    scope,
    rid: current.restaurant_id,
    tid: current.table_id,
    ttlSeconds: RECEIPT_SCOPE_TTL_SECONDS,
  });

  await db.session.create({
    data: {
      id: newSessionId,
      table_id: current.table_id,
      restaurant_id: current.restaurant_id,
      token_hash: hashToken(token),
      scope: "receipt",
      payment_id: params.paymentId,
      user_agent: current.user_agent,
      ip: current.ip,
      expires_at: expiresAt,
    },
  });

  await revokeSession(params.sessionId);

  return { token, expiresAt };
}
