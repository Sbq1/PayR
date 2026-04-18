import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";

/**
 * Autenticación efímera del comensal (distinta del staff login).
 *
 * - JWT HS256 firmado con AUTH_SECRET (reusado con scope diferente).
 * - Claims: { sid, scope: "table:<tid>" | "receipt:<paymentId>", rid, tid }.
 * - TTL 2h para scope table; 15min para scope receipt (post-pago).
 * - Hash SHA256 del JWT se guarda en sessions.token_hash para permitir
 *   revocación server-side sin invalidar la firma.
 *
 * Este módulo es server-only. Importarlo desde client components va a
 * expandir el bundle con 'node:crypto' y potencialmente filtrar el secret.
 */

export const CUSTOMER_SESSION_TTL_SECONDS = 2 * 60 * 60; // 2h
export const RECEIPT_SCOPE_TTL_SECONDS = 15 * 60; // 15min

let _secretCache: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secretCache) return _secretCache;
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new AppError(
      "AUTH_SECRET no configurado",
      500,
      "CONFIG_ERROR"
    );
  }
  _secretCache = new TextEncoder().encode(s);
  return _secretCache;
}

export type CustomerScope = `table:${string}` | `receipt:${string}`;

export interface CustomerClaims {
  sid: string;
  scope: CustomerScope;
  rid: string;
  tid: string;
  iat: number;
  exp: number;
}

export interface SignClaimsInput {
  sid: string;
  scope: CustomerScope;
  rid: string;
  tid: string;
  ttlSeconds?: number;
}

export async function signCustomerJwt(input: SignClaimsInput): Promise<string> {
  const ttl = input.ttlSeconds ?? CUSTOMER_SESSION_TTL_SECONDS;
  return new SignJWT({
    sid: input.sid,
    scope: input.scope,
    rid: input.rid,
    tid: input.tid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getSecret());
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyCustomerJwt(token: string): Promise<CustomerClaims> {
  const { payload } = await jwtVerify(token, getSecret());
  const { sid, scope, rid, tid, iat, exp } = payload as Record<string, unknown>;
  if (
    typeof sid !== "string" ||
    typeof scope !== "string" ||
    typeof rid !== "string" ||
    typeof tid !== "string" ||
    typeof iat !== "number" ||
    typeof exp !== "number"
  ) {
    throw new AppError("Token inválido", 401, "SESSION_INVALID");
  }
  if (!scope.startsWith("table:") && !scope.startsWith("receipt:")) {
    throw new AppError("Scope inválido", 401, "SESSION_INVALID");
  }
  return { sid, scope: scope as CustomerScope, rid, tid, iat, exp };
}

export interface CustomerSessionContext {
  sessionId: string;
  scope: CustomerScope;
  restaurantId: string;
  restaurantSlug: string;
  tableId: string;
  paymentId: string | null;
}

/**
 * Middleware de auth para endpoints del comensal.
 *
 * 1. Lee Authorization: Bearer <jwt>.
 * 2. Verifica firma HS256.
 * 3. Valida en DB: sesión existe, no revocada, no expirada.
 * 4. Valida restaurant.is_active (feature de negocio — restaurantes pausados
 *    no reciben pagos aunque el QR siga físicamente vivo).
 * 5. Valida consistencia DB vs claims (defensa contra JWT fabricado con
 *    claims distintos al row real).
 * 6. Opcionalmente narrow contra tableId / restaurantSlug provistos por
 *    el handler para IDOR defense-in-depth.
 *
 * Lanza AppError con códigos semánticos mapeados por handleApiError:
 * - SESSION_MISSING (401): falta header o está vacío
 * - SESSION_INVALID (401): firma, claims malformados o sesión no existe
 * - SESSION_REVOKED (401): revoked_at IS NOT NULL
 * - SESSION_EXPIRED (401): expires_at < NOW()
 * - RESTAURANT_INACTIVE (403): restaurante pausado
 * - FORBIDDEN (403): narrow check falló (IDOR)
 */
export async function requireCustomerSession(
  request: Request,
  narrow?: { tableId?: string; restaurantSlug?: string }
): Promise<CustomerSessionContext> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new AppError("Falta Authorization Bearer", 401, "SESSION_MISSING");
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError("Bearer vacío", 401, "SESSION_MISSING");
  }

  let claims: CustomerClaims;
  try {
    claims = await verifyCustomerJwt(token);
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Errores de jose (firma inválida, exp vencido, etc.)
    throw new AppError(
      "Sesión inválida o expirada",
      401,
      "SESSION_INVALID"
    );
  }

  const tokenHash = hashToken(token);
  const row = await db.session.findUnique({
    where: { token_hash: tokenHash },
    include: {
      restaurants: {
        select: { id: true, slug: true, is_active: true },
      },
    },
  });

  if (!row) {
    throw new AppError("Sesión no encontrada", 401, "SESSION_INVALID");
  }
  if (row.revoked_at) {
    throw new AppError("Sesión revocada", 401, "SESSION_REVOKED");
  }
  if (row.expires_at.getTime() <= Date.now()) {
    throw new AppError("Sesión expirada", 401, "SESSION_EXPIRED");
  }

  // Consistencia entre claims firmados y estado DB. Si divergen, el JWT
  // probablemente fue manipulado o el row fue modificado manualmente.
  if (row.restaurant_id !== claims.rid || row.table_id !== claims.tid) {
    throw new AppError("Sesión inconsistente", 401, "SESSION_INVALID");
  }

  if (!row.restaurants.is_active) {
    throw new AppError(
      "Este restaurante está pausado temporalmente. Paga al mesero.",
      403,
      "RESTAURANT_INACTIVE"
    );
  }

  // IDOR narrow — el handler especifica el tableId/slug que espera de la URL.
  if (narrow?.tableId !== undefined && narrow.tableId !== row.table_id) {
    throw new AppError("Acceso denegado", 403, "FORBIDDEN");
  }
  if (
    narrow?.restaurantSlug !== undefined &&
    narrow.restaurantSlug !== row.restaurants.slug
  ) {
    throw new AppError("Acceso denegado", 403, "FORBIDDEN");
  }

  return {
    sessionId: row.id,
    scope: claims.scope,
    restaurantId: row.restaurant_id,
    restaurantSlug: row.restaurants.slug,
    tableId: row.table_id,
    paymentId: row.payment_id,
  };
}
