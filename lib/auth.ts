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
const COOKIE_NAME = "sc-session";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  restaurantId: string | null;
  restaurantSlug: string | null;
  planTier: string | null;
}

/**
 * Login: verifica credenciales y crea cookie JWT.
 */
export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.password_hash) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  // Obtener restaurante
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

  // Crear JWT
  const token = await new SignJWT({ user: sessionUser })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return sessionUser;
}

/**
 * Auth: obtiene la sesion actual desde la cookie JWT.
 */
export async function auth(): Promise<{ user: SessionUser } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());
    const user = payload.user as SessionUser;
    if (!user?.id) return null;

    return { user };
  } catch {
    return null;
  }
}

/**
 * Logout: elimina la cookie de sesion.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
