"use client";

import { useEffect, useState } from "react";

interface Session {
  restaurantId: string;
  userId: string;
  email: string;
}

/**
 * Hook que carga la sesión del usuario autenticado.
 * Retorna restaurantId, loading state, y la sesión completa.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/auth/session", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Session fetch failed");
        return r.json();
      })
      .then((data) => {
        if (data?.restaurantId) {
          setSession(data);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Session error:", err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return {
    session,
    restaurantId: session?.restaurantId ?? null,
    loading,
  };
}
