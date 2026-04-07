import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", timestamp, db: "connected" });
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        timestamp,
        db: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
