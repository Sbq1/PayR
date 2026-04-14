"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  Lock,
  QrCode as QrIcon,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { QrFrameSelector, type QrFrameStyle } from "./_components/QrFrameSelector";

type PlanTier = "STARTER" | "PRO" | "ENTERPRISE";
type EcLevel = "L" | "M" | "Q" | "H";

interface QrConfig {
  dark: string;
  light: string;
  errorCorrection: EcLevel;
  frameStyle: QrFrameStyle;
}

interface ConfigResponse {
  config: QrConfig;
  defaults: QrConfig;
  planTier: PlanTier;
  allowedFeatures: Record<string, boolean>;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const EC_LABELS: Record<EcLevel, string> = {
  L: "Baja (7%)",
  M: "Media (15%)",
  Q: "Alta (25%)",
  H: "Máxima (30%)",
};

export default function QrDesignPage() {
  const { restaurantId } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<QrConfig | null>(null);
  const [defaults, setDefaults] = useState<QrConfig | null>(null);
  const [planTier, setPlanTier] = useState<PlanTier>("STARTER");
  const [allowed, setAllowed] = useState<Record<string, boolean>>({});

  const [preview, setPreview] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewToken = useRef(0);

  const canColors = !!allowed.qrColorsCustom;
  const canEc = !!allowed.qrErrorCorrectionCustom;
  const canFrame = !!allowed.qrFrameCustom;
  const isLocked = !canColors && !canEc && !canFrame;

  const loadConfig = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/${rid}/qr/config`);
      if (!res.ok) {
        toast.error("No se pudo cargar la configuración");
        return;
      }
      const data: ConfigResponse = await res.json();
      setConfig(data.config);
      setDefaults(data.defaults);
      setPlanTier(data.planTier);
      setAllowed(data.allowedFeatures);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    loadConfig(restaurantId);
  }, [restaurantId, loadConfig]);

  // Debounced live preview
  useEffect(() => {
    if (!restaurantId || !config) return;
    const token = ++previewToken.current;
    const id = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch(`/api/restaurant/${restaurantId}/qr/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (token !== previewToken.current) return; // stale
        if (res.ok) {
          const { dataUrl } = await res.json();
          setPreview(dataUrl);
        }
      } finally {
        if (token === previewToken.current) setPreviewing(false);
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [config, restaurantId]);

  const darkValid = !!config && HEX_RE.test(config.dark);
  const lightValid = !!config && HEX_RE.test(config.light);

  const contrast = useMemo(() => {
    if (!config || !darkValid || !lightValid) return null;
    return computeContrast(config.dark, config.light);
  }, [config, darkValid, lightValid]);

  const contrastOk = contrast !== null && contrast >= 3;

  function updateField<K extends keyof QrConfig>(key: K, value: QrConfig[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }

  function handleReset() {
    if (!defaults) return;
    setConfig({ ...defaults });
    toast.success("Valores restablecidos");
  }

  async function handleSave() {
    if (!restaurantId || !config) return;
    if (!darkValid || !lightValid || !contrastOk) {
      toast.error("Corrige los errores antes de guardar");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/qr/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success("Diseño guardado");
      } else if (res.status === 429) {
        toast.error("Demasiados cambios — espera un momento");
      } else if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Tu plan no incluye esta personalización");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver a Configuración
        </Link>
        <h1 className="text-[18px] font-semibold text-gray-900">Diseño del QR</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Personaliza los colores y nivel de corrección del QR que ven tus clientes.
        </p>
      </div>

      {loading || !config ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="space-y-6">
            {isLocked && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[13px] text-amber-800">
                  <p className="font-semibold mb-1">
                    Tu plan {planTier} usa el QR por defecto
                  </p>
                  <p className="text-amber-700">
                    Actualiza a <strong>PRO</strong> para personalizar colores y corrección.{" "}
                    <Link href="/settings/subscription" className="underline font-semibold">
                      Ver planes
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Colors */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-gray-900">Colores</h2>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Código hex #RRGGBB. Contraste mínimo 3:1 para escaneo fiable.
                  </p>
                </div>
                {!canColors && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase">
                    <Lock className="w-2.5 h-2.5" />
                    PRO
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <ColorField
                  label="Color oscuro (módulos)"
                  value={config.dark}
                  onChange={(v) => updateField("dark", v)}
                  disabled={!canColors}
                  valid={darkValid}
                />
                <ColorField
                  label="Color claro (fondo)"
                  value={config.light}
                  onChange={(v) => updateField("light", v)}
                  disabled={!canColors}
                  valid={lightValid}
                />
              </div>

              {darkValid && lightValid && contrast !== null && (
                <div
                  className={`mt-3 flex items-center gap-2 text-[12px] ${
                    contrastOk ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                  Contraste {contrast.toFixed(2)}:1
                  {!contrastOk && " — insuficiente, el QR podría no escanearse"}
                </div>
              )}
            </section>

            {/* Error correction */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-gray-900">
                    Nivel de corrección
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Mayor nivel = más tolerante a daño físico, QR más denso.
                  </p>
                </div>
                {!canEc && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase">
                    <Lock className="w-2.5 h-2.5" />
                    PRO
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(["L", "M", "Q", "H"] as const).map((level) => {
                  const active = config.errorCorrection === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={!canEc}
                      onClick={() => updateField("errorCorrection", level)}
                      className={`px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      } ${!canEc ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="font-bold">{level}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">
                        {EC_LABELS[level]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Frame style */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-gray-900">
                    Frame decorativo
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Se aplica a la plantilla imprimible por mesa.
                  </p>
                </div>
                {!canFrame && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase">
                    <Lock className="w-2.5 h-2.5" />
                    Enterprise
                  </span>
                )}
              </div>

              <QrFrameSelector
                value={config.frameStyle}
                onChange={(v) => updateField("frameStyle", v)}
                disabled={!canFrame}
              />
            </section>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || isLocked || !darkValid || !lightValid || !contrastOk}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Guardar cambios
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer
              </button>
            </div>
          </div>

          {/* Preview */}
          <aside className="rounded-xl border border-gray-200 bg-gray-50 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                Vista previa
              </h3>
              {previewing && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
            <div className="relative aspect-square rounded-lg bg-white p-4 flex items-center justify-center border border-gray-200">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Vista previa del QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrIcon className="w-12 h-12 text-gray-200" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-3 text-center leading-relaxed">
              Los cambios se aplican a todos los QR de mesa al guardar.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

// ─── subcomponents ───────────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
  disabled,
  valid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  valid: boolean;
}) {
  const pickerValue = HEX_RE.test(value) ? value : "#000000";
  return (
    <div>
      <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
          !valid
            ? "border-red-300 bg-red-50/30"
            : "border-gray-200 bg-white focus-within:border-gray-900"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={`${label} — selector`}
          className="w-7 h-7 rounded border border-gray-300 cursor-pointer shrink-0 disabled:cursor-not-allowed"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          aria-label={`${label} — código hex`}
          placeholder="#000000"
          maxLength={7}
          className="flex-1 bg-transparent text-[13px] text-gray-900 font-mono tabular-nums outline-none disabled:cursor-not-allowed"
        />
      </div>
      {!valid && (
        <p className="text-[11px] text-red-600 mt-1">Formato hex inválido</p>
      )}
    </div>
  );
}

// Matches lib/utils/color-validate.ts — keep in sync
function computeContrast(a: string, b: string): number {
  const lA = luminance(a);
  const lB = luminance(b);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const rgb = [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
