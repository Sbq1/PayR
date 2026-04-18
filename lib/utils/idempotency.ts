import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { AppError } from "@/lib/utils/errors";

// Wrapper para el header HTTP Idempotency-Key. Ver migración 4 y plan
// §2.3/4.1 para invariantes. 3 modos de respuesta:
//  - { replay:true, ... }   → respuesta almacenada, no re-ejecutar handler
//  - { replay:false, save } → handler procede; el caller debe llamar save()
//                              con (status, body) tras completar
//  - throw AppError         → 409 CONFLICT (body distinto), 409 IN_FLIGHT
//                              (request concurrente), 400 MISSING / INVALID
//
// Se saca del camino happy path con el menor número de queries (1-2).

/**
 * Ventana durante la cual un request en vuelo bloquea duplicados.
 *
 * 60s post-review Fase 2: cubre timeout típico Wompi (15-30s) + margen
 * para el user tarda en completar tarjeta. A 30s un tercer click tras
 * timeout de Wompi caía fuera de la ventana y se creaba Payment #2;
 * combinado con el reuse-si-misma-sess en payment.service.ts evita
 * doble cobro sin empeorar UX.
 */
const IN_FLIGHT_WINDOW_MS = 60_000;
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24h

export interface IdempotencyParams {
  key: string;
  sessionId: string;
  /** Discriminador: e.g. "POST /api/payment/create". */
  endpoint: string;
  /** Body parseado que se hashea canónicamente para detectar replays con body distinto. */
  requestBody: unknown;
  ttlSeconds?: number;
}

export type IdempotencyResult<T> =
  | { replay: true; status: number; body: T }
  | {
      replay: false;
      save: (status: number, body: T) => Promise<void>;
    };

/**
 * Extrae + valida el header `Idempotency-Key`. Formato permisivo:
 * alphanumeric + dash + underscore, 8-64 chars (UUID v4 encaja).
 */
export function getIdempotencyKey(request: Request): string {
  const key = request.headers.get("idempotency-key");
  if (!key) {
    throw new AppError(
      "Header Idempotency-Key requerido",
      400,
      "IDEMPOTENCY_KEY_MISSING"
    );
  }
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) {
    throw new AppError(
      "Idempotency-Key inválido (8-64 chars alfanuméricos)",
      400,
      "IDEMPOTENCY_KEY_INVALID"
    );
  }
  return key;
}

export async function withIdempotency<T>(
  params: IdempotencyParams
): Promise<IdempotencyResult<T>> {
  const requestHash = sha256Hex(canonicalize(params.requestBody));
  const ttlSec = params.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  const pkWhere = {
    key_session_id_endpoint: {
      key: params.key,
      session_id: params.sessionId,
      endpoint: params.endpoint,
    },
  };

  const existing = await db.idempotencyKey.findUnique({ where: pkWhere });

  if (existing) {
    // Replay con body distinto = intento de manipulación o bug del cliente.
    if (existing.request_hash !== requestHash) {
      throw new AppError(
        "Idempotency-Key reusado con body distinto",
        409,
        "IDEMPOTENCY_CONFLICT"
      );
    }

    // Ya completado → replay de la respuesta almacenada.
    if (existing.completed_at) {
      return {
        replay: true,
        status: existing.response_status ?? 200,
        body: (existing.response_body ?? {}) as T,
      };
    }

    // In-flight reciente → el cliente hizo doble submit antes de que la
    // primera termine. Rechazar con 409 en vez de crear 2 Payments.
    const ageMs = Date.now() - existing.locked_at.getTime();
    if (ageMs < IN_FLIGHT_WINDOW_MS) {
      throw new AppError(
        "Request previa aún en proceso",
        409,
        "IDEMPOTENCY_IN_FLIGHT"
      );
    }
    // Lock stale (>60s sin completar) — asumimos que el handler crasheó
    // y dejó el slot huérfano. Procedemos con el update abajo para
    // re-tomarlo.
  }

  // Upsert: crea si nuevo, o re-toma si había lock stale.
  await db.idempotencyKey.upsert({
    where: pkWhere,
    create: {
      key: params.key,
      session_id: params.sessionId,
      endpoint: params.endpoint,
      request_hash: requestHash,
      expires_at: expiresAt,
    },
    update: {
      request_hash: requestHash,
      locked_at: new Date(),
      completed_at: null,
      response_status: null,
      response_body: Prisma.JsonNull, // Prisma distingue NULL SQL de JSON null
      expires_at: expiresAt,
    },
  });

  return {
    replay: false,
    save: async (status, body) => {
      await db.idempotencyKey.update({
        where: pkWhere,
        data: {
          response_status: status,
          response_body: body as never, // JSON field — Prisma acepta cualquier JSON-serializable
          completed_at: new Date(),
        },
      });
    },
  };
}

/**
 * Hash determinístico del body independiente del orden de claves. Sin
 * esto, dos clientes JSON con el mismo contenido pero diferente orden
 * de serialización producirían hashes distintos y romperían la detección
 * de replay legítimo.
 */
function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(",")}}`;
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
