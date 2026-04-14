import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";
import { generateQrDataUrl, type QrErrorCorrection, type QrRenderOptions } from "@/lib/utils/qr";
import {
  allowedFeatures,
  canUseFeature,
  type Feature,
  type PlanTier,
} from "@/lib/utils/plan-gate";
import {
  normalizeHex,
  validateQrColors,
} from "@/lib/utils/color-validate";

export type QrFrameStyle = "none" | "simple" | "branded";

export interface QrConfig {
  dark: string;
  light: string;
  errorCorrection: QrErrorCorrection;
  frameStyle: QrFrameStyle;
}

export interface QrConfigResponse {
  config: QrConfig;
  defaults: QrConfig;
  planTier: PlanTier;
  allowedFeatures: Record<Feature, boolean>;
}

const DEFAULT_CONFIG: QrConfig = {
  dark: "#000000",
  light: "#ffffff",
  errorCorrection: "M",
  frameStyle: "none",
};

const VALID_EC = new Set<QrErrorCorrection>(["L", "M", "Q", "H"]);
const VALID_FRAME = new Set<QrFrameStyle>(["none", "simple", "branded"]);

function isValidFrame(value: string): value is QrFrameStyle {
  return VALID_FRAME.has(value as QrFrameStyle);
}

function isValidEc(value: string): value is QrErrorCorrection {
  return VALID_EC.has(value as QrErrorCorrection);
}

async function loadRestaurant(restaurantId: string) {
  const rest = await db.restaurant.findUnique({
    where: { id: restaurantId },
    include: { subscription_plans: true },
  });
  if (!rest) throw new AppError("Restaurante no encontrado", 404, "NOT_FOUND");
  return rest;
}

export async function getQrConfig(restaurantId: string): Promise<QrConfigResponse> {
  const rest = await loadRestaurant(restaurantId);
  const tier = rest.subscription_plans.tier as PlanTier;

  return {
    config: {
      dark: rest.qr_dark_color,
      light: rest.qr_light_color,
      errorCorrection: rest.qr_error_correction as QrErrorCorrection,
      frameStyle: rest.qr_frame_style as QrFrameStyle,
    },
    defaults: DEFAULT_CONFIG,
    planTier: tier,
    allowedFeatures: allowedFeatures(tier),
  };
}

export interface UpdateQrConfigDto {
  dark?: string;
  light?: string;
  errorCorrection?: string;
  frameStyle?: string;
}

export async function updateQrConfig(
  restaurantId: string,
  dto: UpdateQrConfigDto,
): Promise<QrConfig> {
  const rest = await loadRestaurant(restaurantId);
  const tier = rest.subscription_plans.tier as PlanTier;

  const current: QrConfig = {
    dark: rest.qr_dark_color,
    light: rest.qr_light_color,
    errorCorrection: rest.qr_error_correction as QrErrorCorrection,
    frameStyle: rest.qr_frame_style as QrFrameStyle,
  };

  const wantsColorChange =
    (dto.dark !== undefined && dto.dark !== current.dark) ||
    (dto.light !== undefined && dto.light !== current.light);

  const wantsEcChange =
    dto.errorCorrection !== undefined &&
    dto.errorCorrection !== current.errorCorrection;

  const wantsFrameChange =
    dto.frameStyle !== undefined && dto.frameStyle !== current.frameStyle;

  if (wantsColorChange && !canUseFeature(tier, "qrColorsCustom")) {
    throw new AppError(
      "Los colores personalizados requieren plan PRO o superior",
      403,
      "feature_not_in_plan",
    );
  }

  if (wantsEcChange && !canUseFeature(tier, "qrErrorCorrectionCustom")) {
    throw new AppError(
      "El nivel de corrección de error requiere plan PRO o superior",
      403,
      "feature_not_in_plan",
    );
  }

  if (wantsFrameChange && !canUseFeature(tier, "qrFrameCustom")) {
    throw new AppError(
      "El frame decorativo requiere plan ENTERPRISE",
      403,
      "feature_not_in_plan",
    );
  }

  const nextDark = dto.dark !== undefined ? normalizeHex(dto.dark) : current.dark;
  const nextLight = dto.light !== undefined ? normalizeHex(dto.light) : current.light;
  const nextEc = dto.errorCorrection ?? current.errorCorrection;
  const nextFrame = dto.frameStyle ?? current.frameStyle;

  const colorError = validateQrColors(nextDark, nextLight);
  if (colorError) {
    throw new AppError(
      colorMessage(colorError),
      400,
      colorError.code,
    );
  }

  if (!isValidEc(nextEc)) {
    throw new AppError("Nivel de corrección inválido", 400, "invalid_error_correction");
  }

  if (!isValidFrame(nextFrame)) {
    throw new AppError("Estilo de frame inválido", 400, "invalid_frame_style");
  }

  await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      qr_dark_color: nextDark,
      qr_light_color: nextLight,
      qr_error_correction: nextEc,
      qr_frame_style: nextFrame,
    },
  });

  return {
    dark: nextDark,
    light: nextLight,
    errorCorrection: nextEc,
    frameStyle: nextFrame,
  };
}

export interface PreviewDto {
  dark?: string;
  light?: string;
  errorCorrection?: string;
}

export async function generateConfigPreview(
  restaurantId: string,
  dto: PreviewDto,
): Promise<{ dataUrl: string }> {
  const rest = await loadRestaurant(restaurantId);
  const tier = rest.subscription_plans.tier as PlanTier;

  const current: QrConfig = {
    dark: rest.qr_dark_color,
    light: rest.qr_light_color,
    errorCorrection: rest.qr_error_correction as QrErrorCorrection,
    frameStyle: rest.qr_frame_style as QrFrameStyle,
  };

  // Plan gate on preview too — evita generar previews de tiers no permitidos
  const wantsColorChange =
    (dto.dark !== undefined && dto.dark !== current.dark) ||
    (dto.light !== undefined && dto.light !== current.light);
  if (wantsColorChange && !canUseFeature(tier, "qrColorsCustom")) {
    throw new AppError(
      "Los colores personalizados requieren plan PRO o superior",
      403,
      "feature_not_in_plan",
    );
  }

  const wantsEcChange =
    dto.errorCorrection !== undefined &&
    dto.errorCorrection !== current.errorCorrection;
  if (wantsEcChange && !canUseFeature(tier, "qrErrorCorrectionCustom")) {
    throw new AppError(
      "El nivel de corrección de error requiere plan PRO o superior",
      403,
      "feature_not_in_plan",
    );
  }

  const dark = dto.dark !== undefined ? normalizeHex(dto.dark) : current.dark;
  const light = dto.light !== undefined ? normalizeHex(dto.light) : current.light;
  const ec = dto.errorCorrection ?? current.errorCorrection;

  const colorError = validateQrColors(dark, light);
  if (colorError) {
    throw new AppError(colorMessage(colorError), 400, colorError.code);
  }

  if (!isValidEc(ec)) {
    throw new AppError("Nivel de corrección inválido", 400, "invalid_error_correction");
  }

  const sampleUrl = `https://smart-checkout.co/${rest.slug}/preview`;
  const opts: QrRenderOptions = {
    dark,
    light,
    errorCorrection: ec,
    width: 400,
    margin: 2,
  };
  const dataUrl = await generateQrDataUrl(sampleUrl, opts);
  return { dataUrl };
}

function colorMessage(err: NonNullable<ReturnType<typeof validateQrColors>>): string {
  switch (err.code) {
    case "invalid_hex":
      return `Color inválido (${err.which}): debe ser hex #RRGGBB`;
    case "colors_identical":
      return "Los colores oscuro y claro no pueden ser iguales";
    case "contrast_insufficient":
      return `Contraste insuficiente (${err.ratio}:1). Mínimo requerido: ${err.min}:1`;
  }
}
