import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

let _jwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (_jwtSecret) return _jwtSecret;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET must be set. Sessions cannot be signed without a secret.");
  }
  _jwtSecret = new TextEncoder().encode(secret);
  return _jwtSecret;
}

export const COOKIE_NAME = "sc-session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Hash estático usado para igualar timing cuando el email no existe.
// Es un bcrypt(12) de una cadena aleatoria — el compare siempre devuelve false.
const DUMMY_PASSWORD_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8bIL4hF7z7vY6nQbqFkAkUqSiCQp7.";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  restaurantId: string | null;
  restaurantSlug: string | null;
  planTier: string | null;
}

interface SessionPayload {
  user: SessionUser;
  sv: number;
}

async function signSession(user: SessionUser, sessionVersion: number): Promise<string> {
  return new SignJWT({ user, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

/**
 * Login: verifica credenciales y crea cookie JWT.
 * Retorna null en credenciales inválidas. Usa dummy bcrypt compare
 * cuando el email no existe para evitar timing attacks.
 */
export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.password_hash) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  const restaurant = await db.restaurant.findFirst({
    where: { owner_id: user.id },
    include: { subscription_plans: true },
    orderBy: { created_at: "desc" },
  });

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    restaurantId: restaurant?.id || null,
    restaurantSlug: restaurant?.slug || null,
    planTier: restaurant?.subscription_plans.tier || null,
  };

  const token = await signSession(sessionUser, user.session_version);
  await setSessionCookie(token);

  return sessionUser;
}

/**
 * Auth: obtiene la sesión actual desde la cookie JWT y valida session_version
 * contra la DB para permitir invalidación global (reset password, logout-all).
 */
export async function auth(): Promise<{ user: SessionUser } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());
    const { user, sv } = payload as unknown as SessionPayload;
    if (!user?.id || typeof sv !== "number") return null;

    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { session_version: true },
    });
    if (!current || current.session_version !== sv) return null;

    return { user };
  } catch {
    return null;
  }
}

/**
 * Issue a fresh session cookie reutilizando el payload actual.
 * Usado por el endpoint de refresh manual.
 */
export async function refreshSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const { user, sv } = payload as unknown as SessionPayload;
    if (!user?.id || typeof sv !== "number") return null;

    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { session_version: true },
    });
    if (!current || current.session_version !== sv) return null;

    const newToken = await signSession(user, sv);
    await setSessionCookie(newToken);
    return user;
  } catch {
    return null;
  }
}

/**
 * Logout: elimina la cookie de sesión.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
