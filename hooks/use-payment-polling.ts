"use client";

import { useEffect, useRef, useState } from "react";
import {
  customerAuthHeader,
  clearCustomerSession,
} from "@/hooks/use-customer-session";

// Fase 2.9 — Polling del cliente post-redirect Wompi.
//
// Tras `/result?status=APPROVED&ref=X`, Wompi internamente puede tardar
// algunos segundos en reflejar APPROVED en su API + el webhook a veces
// se pierde (o no puede llegar, en dev local). Este hook cierra el loop:
// consulta `/api/payment/verify` en un loop con jitter hasta que:
//   - el server confirma un estado terminal (APPROVED/DECLINED/VOIDED/ERROR)
//   - o se agotan 2 minutos → hand-off al cron reconcile-hot (Fase 4)
//
// Principios clave:
//   - Jitter obligatorio: sin él, un incidente Wompi genera thundering
//     herd (cientos de clientes al mismo endpoint en el mismo segundo).
//   - No downgrade: si `status` ya llegó a terminal, un PENDING posterior
//     (race con otra capa) NO lo sobreescribe.
//   - 401 mid-poll no detiene el loop: el webhook / reconcile-hot cron
//     cerrarán el pago server-side aunque la sesión del comensal muera.
//   - AbortController + clearTimeout en unmount: cero leak si el usuario
//     cierra la pestaña mientras se está pollingando.

const POLL_INTERVAL_MS = 3_000;
const JITTER_MS = 500; // ventana efectiva [2500, 3500]
const FIRST_TICK_MS = 1_000; // primer check temprano — Wompi suele aprobar rápido
const RATE_LIMIT_RETRY_MS = 6_000;
const TIMEOUT_MS = 120_000;
const SLOW_THRESHOLD_MS = 60_000;

type TerminalStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
export type PaymentPollingStatus = TerminalStatus | "PENDING";

const TERMINAL_SET = new Set<PaymentPollingStatus>([
  "APPROVED",
  "DECLINED",
  "VOIDED",
  "ERROR",
]);

export function isTerminalPaymentStatus(
  s: string | null | undefined
): s is TerminalStatus {
  return !!s && TERMINAL_SET.has(s as PaymentPollingStatus);
}

function nextDelayMs(): number {
  return POLL_INTERVAL_MS + (Math.random() - 0.5) * 2 * JITTER_MS;
}

export interface PaymentPollingResult {
  /** Último estado confirmado por el server. Preferimos terminales: no downgrade. */
  status: PaymentPollingStatus | null;
  /** True entre mount y terminal/timeout/error. */
  isPolling: boolean;
  /** True si pasaron >60s sin resolución — la UI muestra "tardando más". */
  isSlow: boolean;
  /** True si se alcanzó el timeout de 2min sin terminal → hand-off al cron. */
  timedOut: boolean;
  /** Error terminal del reconcile (404 NOT_FOUND, 409 MISMATCH). No transitorio. */
  error: string | null;
}

/**
 * Polling de `/api/payment/verify` hasta estado terminal o timeout.
 *
 * @param reference  Referencia de transacción Wompi (del query param `ref`).
 * @param tableId    Para leer el JWT de `sessionStorage` vía `customerAuthHeader`.
 * @param initialStatus  Status del URL (`?status=`). Si ya es terminal, el hook
 *                       no inicia polling — confiamos en que Wompi ya decidió.
 */
export function usePaymentPolling(
  reference: string | null,
  tableId: string,
  initialStatus: string | null
): PaymentPollingResult {
  const normalizedInitial =
    initialStatus && (isTerminalPaymentStatus(initialStatus) || initialStatus === "PENDING")
      ? (initialStatus as PaymentPollingStatus)
      : null;

  const [status, setStatus] = useState<PaymentPollingStatus | null>(
    normalizedInitial
  );
  const [isPolling, setIsPolling] = useState<boolean>(
    !!reference && !isTerminalPaymentStatus(initialStatus)
  );
  const [isSlow, setIsSlow] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para cleanup sin disparar re-renders.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!reference) return;
    // Guard StrictMode + HMR: el effect no debe iniciar dos loops.
    if (startedRef.current) return;
    startedRef.current = true;

    // URL trae terminal → no pollear. El server es autoritativo pero confiar
    // en Wompi redirect es suficiente mientras el webhook/cron cierre en DB.
    if (isTerminalPaymentStatus(initialStatus)) {
      setIsPolling(false);
      return;
    }

    let stopped = false;

    const slowTimer = setTimeout(() => {
      if (!stopped) setIsSlow(true);
    }, SLOW_THRESHOLD_MS);

    const hardTimer = setTimeout(() => {
      stopped = true;
      setTimedOut(true);
      setIsPolling(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    }, TIMEOUT_MS);

    function scheduleNext(overrideMs?: number): void {
      if (stopped) return;
      const delay = overrideMs ?? nextDelayMs();
      timerRef.current = setTimeout(tick, delay);
    }

    function stop(): void {
      stopped = true;
      setIsPolling(false);
      clearTimeout(slowTimer);
      clearTimeout(hardTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    }

    async function tick(): Promise<void> {
      if (stopped) return;

      abortRef.current = new AbortController();

      let res: Response;
      try {
        res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...customerAuthHeader(tableId),
          },
          body: JSON.stringify({ reference }),
          signal: abortRef.current.signal,
        });
      } catch (err) {
        // Abort en unmount/timeout: nada que hacer.
        if ((err as Error).name === "AbortError") return;
        if (stopped) return;
        // Network transitorio → reintento con backoff normal.
        scheduleNext();
        return;
      }

      if (stopped) return;

      // 401 sesión expiró mid-pago: limpiar cache local pero NO parar.
      // El pago ya está "en vuelo" con Wompi; el webhook o el cron
      // reconcile-hot lo cerrarán server-side aunque el comensal pierda
      // visibilidad. Seguir pollingando por si la sesión se re-crea.
      if (res.status === 401) {
        clearCustomerSession(tableId);
        scheduleNext();
        return;
      }

      if (res.status === 429) {
        scheduleNext(RATE_LIMIT_RETRY_MS);
        return;
      }

      if (res.status === 404) {
        setError("Pago no encontrado");
        stop();
        return;
      }

      if (res.status === 409) {
        // MISMATCH del reconcile — discrepancia real (amount/currency).
        // No es transitorio: parar y mostrar error.
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Discrepancia en el pago");
        stop();
        return;
      }

      if (!res.ok) {
        // 5xx u otros transitorios → reintento.
        scheduleNext();
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { status?: string }
        | null;
      const next = data?.status as PaymentPollingStatus | undefined;

      if (!next) {
        scheduleNext();
        return;
      }

      // Preferir terminales: si el estado local ya era terminal, ignorar.
      setStatus((prev) => (isTerminalPaymentStatus(prev) ? prev : next));

      if (isTerminalPaymentStatus(next)) {
        stop();
        return;
      }

      scheduleNext();
    }

    // Primer tick rápido — Wompi frecuentemente ya aprobó para cuando
    // el redirect termina de navegarse.
    timerRef.current = setTimeout(tick, FIRST_TICK_MS);

    return () => {
      stopped = true;
      clearTimeout(slowTimer);
      clearTimeout(hardTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
    // reference/tableId son estables durante la vida del componente — si
    // cambian el Suspense de la page remonta con startedRef=false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, tableId]);

  return { status, isPolling, isSlow, timedOut, error };
}
