/**
 * Feature gating por subscription tier.
 *
 * Regla de oro: toda validación de feature-access debe usar este módulo.
 * Nunca confíes en el frontend. El payload del UI se valida contra el
 * tier real del restaurant leído del server.
 */

export type PlanTier = "STARTER" | "PRO" | "ENTERPRISE";

export const PLAN_TIER_ORDER: Record<PlanTier, number> = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

/**
 * Features gateables. Cada key es el feature flag y el value es el
 * tier MÍNIMO requerido. Un tier mayor automáticamente incluye todos
 * los features de tiers menores.
 */
export const FEATURE_MIN_TIER = {
  // QR branding
  qrColorsCustom: "PRO",
  qrErrorCorrectionCustom: "PRO",
  qrLogoEmbedded: "ENTERPRISE",
  qrFrameCustom: "ENTERPRISE",
  qrPrintableTemplate: "ENTERPRISE",

  // Otros (placeholder para futuras features)
  splitBill: "PRO",
  siigoIntegration: "PRO",
  upsellEngine: "PRO",
  advancedReports: "PRO",
  multiUserRoles: "PRO",
  multiLocation: "ENTERPRISE",
  apiWebhooks: "ENTERPRISE",
  customBranding: "ENTERPRISE",
} as const satisfies Record<string, PlanTier>;

export type Feature = keyof typeof FEATURE_MIN_TIER;

export function canUseFeature(tier: PlanTier, feature: Feature): boolean {
  const required = FEATURE_MIN_TIER[feature];
  return PLAN_TIER_ORDER[tier] >= PLAN_TIER_ORDER[required];
}

export function allowedFeatures(tier: PlanTier): Record<Feature, boolean> {
  const out = {} as Record<Feature, boolean>;
  for (const key of Object.keys(FEATURE_MIN_TIER) as Feature[]) {
    out[key] = canUseFeature(tier, key);
  }
  return out;
}

export class FeatureGateError extends Error {
  readonly status = 403 as const;
  readonly code = "feature_not_in_plan" as const;
  constructor(public readonly feature: Feature, public readonly currentTier: PlanTier) {
    super(
      `La funcionalidad "${feature}" requiere plan ${FEATURE_MIN_TIER[feature]} o superior (actual: ${currentTier})`,
    );
    this.name = "FeatureGateError";
  }
}

export function requireFeature(tier: PlanTier, feature: Feature): void {
  if (!canUseFeature(tier, feature)) {
    throw new FeatureGateError(feature, tier);
  }
}
