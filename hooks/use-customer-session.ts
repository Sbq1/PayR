"use client";

import { useEffect, useRef, useState } from "react";

// Sesión efímera del comensal. Lee qrToken/qrVersion de la URL al montar
// y llama POST /api/session/start. Persiste el JWT en sessionStorage
// (scope por mesa) para reusar entre navegaciones internas; expira al
// cerrar la pestaña.

const STORAGE_KEY_PREFIX = "payr:session:";

interface StoredSession {
  token: string;
  expiresAt: string; // ISO
  sessionId: string;
  restaurant: unknown;
  table: unknown;
}

interface UseCustomerSessionResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  restaurant: unknown;
  table: unknown;
}

function storageKey(tableId: string): string {
  return `${STORAGE_KEY_PREFIX}${tableId}`;
}

function readStored(tableId: string): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(tableId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Margen de 30s para evitar usar un token que está a punto de expirar.
    if (new Date(parsed.expiresAt).getTime() - 30_000 <= Date.now()) {
      sessionStorage.removeItem(storageKey(tableId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(tableId: string, s: StoredSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(tableId), JSON.stringify(s));
}

function clearStored(tableId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(tableId));
}

/** Header Authorization para inyectar en fetches subsecuentes. */
export function customerAuthHeader(tableId: string): Record<string, string> {
  const stored = readStored(tableId);
  return stored ? { Authorization: `Bearer ${stored.token}` } : {};
}

/** Limpia la sesión cuando un endpoint devuelve 401/403 de auth. */
export function clearCustomerSession(tableId: string): void {
  clearStored(tableId);
}

export function useCustomerSession(
  slug: string,
  tableId: string,
  qrToken: string | null,
  qrVersion: number | null
): UseCustomerSessionResult {
  const [state, setState] = useState<UseCustomerSessionResult>({
    token: null,
    loading: true,
    error: null,
    errorCode: null,
    restaurant: null,
    table: null,
  });

  // Evita el doble-fire del effect en StrictMode / dev HMR.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const cached = readStored(tableId);
    if (cached) {
      setState({
        token: cached.token,
        loading: false,
        error: null,
        errorCode: null,
        restaurant: cached.restaurant,
        table: cached.table,
      });
      return;
    }

    if (!qrToken || !qrVersion || qrVersion < 1) {
      setState({
        token: null,
        loading: false,
        error: "El código QR que escaneaste no es válido. Pide al mesero un QR actualizado.",
        errorCode: "QR_MISSING",
        restaurant: null,
        table: null,
      });
      return;
    }

    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, tableId, qrToken, qrVersion }),
          signal: abort.signal,
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          setState({
            token: null,
            loading: false,
            error: body.error ?? `Error ${res.status}`,
            errorCode: body.code ?? null,
            restaurant: null,
            table: null,
          });
          return;
        }

        const stored: StoredSession = {
          token: body.token,
          expiresAt: body.expiresAt,
          sessionId: body.sessionId,
          restaurant: body.restaurant,
          table: body.table,
        };
        writeStored(tableId, stored);

        setState({
          token: body.token,
          loading: false,
          error: null,
          errorCode: null,
          restaurant: body.restaurant,
          table: body.table,
        });
      } catch (err) {
        if (abort.signal.aborted) return;
        setState({
          token: null,
          loading: false,
          error: (err as Error).message || "Error de red",
          errorCode: "NETWORK_ERROR",
          restaurant: null,
          table: null,
        });
      }
    })();

    return () => abort.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tableId]);

  return state;
}
