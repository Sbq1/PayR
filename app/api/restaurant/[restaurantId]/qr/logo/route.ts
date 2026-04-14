import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import {
  uploadQrLogo,
  deleteQrLogo,
  getQrLogoPreview,
} from "@/lib/services/qr.service";
import {
  validateImageUpload,
  imageValidationMessage,
  LOGO_MAX_BYTES,
} from "@/lib/utils/image-validate";

export const runtime = "nodejs";
export const maxDuration = 30;

// Hard ceiling para el body multipart (2x por overhead de encoding + headers)
const MAX_REQUEST_BYTES = LOGO_MAX_BYTES * 2;

const uploadLimiter = rateLimit("qr-logo-upload", { interval: 60_000, limit: 5 });
const readLimiter = rateLimit("qr-logo-get", { interval: 60_000, limit: 30 });
const deleteLimiter = rateLimit("qr-logo-delete", { interval: 60_000, limit: 10 });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await uploadLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return Response.json(
        {
          error: `El archivo supera el límite de ${Math.round(LOGO_MAX_BYTES / 1024)} KB.`,
          code: "file_too_large",
        },
        { status: 413 },
      );
    }

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const form = await request.formData().catch(() => null);
    const file = form?.get("logo");
    if (!(file instanceof File)) {
      return Response.json(
        { error: "Campo 'logo' requerido", code: "invalid_body" },
        { status: 400 },
      );
    }

    const result = await validateImageUpload(file);
    if (!result.ok) {
      return Response.json(
        { error: imageValidationMessage(result.error), code: result.error.code },
        { status: 400 },
      );
    }

    const out = await uploadQrLogo(restaurantId, result.data);
    return Response.json(out);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await readLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const preview = await getQrLogoPreview(restaurantId);
    if (!preview) {
      return Response.json({ hasLogo: false });
    }
    return Response.json({ hasLogo: true, dataUrl: preview.dataUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await deleteLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const out = await deleteQrLogo(restaurantId);
    return Response.json(out);
  } catch (error) {
    return handleApiError(error);
  }
}
