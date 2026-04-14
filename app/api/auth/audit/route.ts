import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auth_event_type } from "@/lib/generated/prisma/client";
import { handleApiError } from "@/lib/utils/errors";
import { z } from "zod/v4";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const querySchema = z.object({
  event_type: z.nativeEnum(auth_event_type).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return Response.json(
        { error: "Parámetros inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { event_type, limit = DEFAULT_LIMIT, cursor } = parsed.data;

    const events = await db.authEvent.findMany({
      where: {
        user_id: session.user.id,
        ...(event_type ? { event_type } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        event_type: true,
        ip: true,
        user_agent: true,
        created_at: true,
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return Response.json({ items, nextCursor }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
