import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";

// Server-only. JWT HS256 con AUTH_SECRET; hash SHA256 en sessions.token_hash
// para revocación sin invalidar firma. Scope 'table:<tid>' (2h) pre-pago,
// 'receipt:<paymentId>' (15min) post-pago.

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
 * Punto único que bloquea operaciones cuando un restaurante está pausado
 * (is_active=false). Cuando llegue `subscription_status`, se extiende aquí
 * en vez de en cada callsite.
 */
export function assertRestaurantOperational(
  restaurant: { is_active: boolean }
): void {
  if (!restaurant.is_active) {
    throw new AppError(
      "Este restaurante está pausado temporalmente. Paga al mesero.",
      403,
      "RESTAURANT_INACTIVE"
    );
  }
}

/**
 * Middleware de auth para endpoints del comensal. Lanza AppError con
 * código semántico (SESSION_MISSING / SESSION_INVALID / SESSION_REVOKED /
 * SESSION_EXPIRED / RESTAURANT_INACTIVE / FORBIDDEN).
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
    throw new AppError("Sesión inválida o expirada", 401, "SESSION_INVALID");
  }

  const row = await db.session.findUnique({
    where: { token_hash: hashToken(token) },
    include: {
      restaurants: { select: { id: true, slug: true, is_active: true } },
    },
  });

  if (!row) throw new AppError("Sesión no encontrada", 401, "SESSION_INVALID");
  if (row.revoked_at) throw new AppError("Sesión revocada", 401, "SESSION_REVOKED");
  if (row.expires_at.getTime() <= Date.now()) {
    throw new AppError("Sesión expirada", 401, "SESSION_EXPIRED");
  }

  // Consistencia claims vs DB — defensa contra JWT con claims manipulados
  // cuyo hash colisiona fortuitamente con otra row (improbable pero barato).
  if (row.restaurant_id !== claims.rid || row.table_id !== claims.tid) {
    throw new AppError("Sesión inconsistente", 401, "SESSION_INVALID");
  }

  assertRestaurantOperational(row.restaurants);

  if (narrow?.tableId && narrow.tableId !== row.table_id) {
    throw new AppError("Acceso denegado", 403, "FORBIDDEN");
  }
  if (narrow?.restaurantSlug && narrow.restaurantSlug !== row.restaurants.slug) {
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
