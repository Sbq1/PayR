import { db } from "@/lib/db";
import { getRedis } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 2_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout`)), ms)
    ),
  ]);
}

type CheckResult = { ok: true } | { ok: false; error: string };

async function checkDb(): Promise<CheckResult> {
  try {
    await withTimeout(db.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS, "db");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const client = getRedis();
  if (!client) return { ok: false, error: "not_configured" };
  try {
    await withTimeout(client.get("__health__"), CHECK_TIMEOUT_MS, "redis");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const [dbResult, redisResult] = await Promise.all([checkDb(), checkRedis()]);

  const allOk = dbResult.ok && redisResult.ok;

  const body = {
    status: allOk ? "ok" : "degraded",
    timestamp,
    checks: {
      db: dbResult.ok ? "connected" : `error: ${dbResult.error}`,
      redis: redisResult.ok ? "connected" : `error: ${redisResult.error}`,
    },
  };

  return Response.json(body, { status: allOk ? 200 : 503 });
}
