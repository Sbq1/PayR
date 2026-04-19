/**
 * Versionado del texto del disclaimer de propina (Ley 2300/2023).
 *
 * Cada versión queda inmutable una vez aceptada por un comensal — la
 * evidencia legal vive en `payments.tip_disclaimer_text_version` apuntando
 * al id acá. Si en 2027 el texto cambia (nueva interpretación, nueva
 * resolución), se agrega "ley-2300-v2" sin modificar v1.
 */
export const TIP_DISCLAIMER_VERSIONS = {
  "ley-2300-v1": {
    text: "Confirmo que la propina es voluntaria y la agrego libremente (Ley 2300 de 2023).",
    effective_from: "2025-01-01",
  },
} as const;

export type TipDisclaimerVersion = keyof typeof TIP_DISCLAIMER_VERSIONS;

export const CURRENT_TIP_DISCLAIMER_VERSION: TipDisclaimerVersion =
  "ley-2300-v1";

export function getTipDisclaimerText(version: TipDisclaimerVersion): string {
  return TIP_DISCLAIMER_VERSIONS[version].text;
}
