"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  Lock,
  Info,
  Palette,
  LayoutTemplate,
  MonitorSmartphone,
  Printer,
  ShieldCheck,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { QrLogoUploader } from "./_components/QrLogoUploader";
import { QrFrameSelector, type QrFrameStyle } from "./_components/QrFrameSelector";
import { FramePreviewCard } from "./_components/FramePreviewCard";

type PlanTier = "STARTER" | "PRO" | "ENTERPRISE";
type EcLevel = "L" | "M" | "Q" | "H";

interface QrConfig {
  dark: string;
  light: string;
  errorCorrection: EcLevel;
  hasLogo: boolean;
  frameStyle: QrFrameStyle;
}

interface ConfigResponse {
  config: QrConfig;
  defaults: QrConfig;
  planTier: PlanTier;
  allowedFeatures: Record<string, boolean>;
  restaurantName: string;
  primaryColor: string;
  secondaryColor: string;
  logoDataUrl: string | null;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const EC_LEVELS: EcLevel[] = ["L", "M", "Q", "H"];
const EC_LABELS: Record<EcLevel, string> = {
  L: "Baja (7%) - Rápido, poco tolerante a daños.",
  M: "Media (15%) - Estándar, buen balance.",
  Q: "Alta (25%) - Alta fiabilidad en desgaste.",
  H: "Máxima (30%) - Ideal para logos embebidos.",
};

const PRESETS = [
  { name: "Classic B&W", dark: "#111827", light: "#ffffff" },
  { name: "Night Mode", dark: "#ffffff", light: "#111827" },
  { name: "Sunset", dark: "#7c2d12", light: "#fffbeb" },
  { name: "Ocean", dark: "#083344", light: "#f0f9ff" },
  { name: "Forest", dark: "#14532d", light: "#f0fdf4" },
  { name: "Wine", dark: "#4c0519", light: "#fff1f2" },
];

export default function QrDesignPage() {
  const { restaurantId } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"colors" | "ec" | "logo" | "frame">("colors");
  const [previewMode, setPreviewMode] = useState<"mobile" | "printable">("printable");
  
  const [config, setConfig] = useState<QrConfig | null>(null);
  const [initialConfig, setInitialConfig] = useState<QrConfig | null>(null);
  const [defaults, setDefaults] = useState<QrConfig | null>(null);
  
  const [allowed, setAllowed] = useState<Record<string, boolean>>({});
  const [restaurantName, setRestaurantName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4648d4");
  const [secondaryColor, setSecondaryColor] = useState("#6b38d4");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewToken = useRef(0);

  const canColors = !!allowed.qrColorsCustom;
  const canEc = !!allowed.qrErrorCorrectionCustom;
  const canLogo = !!allowed.qrLogoEmbedded;
  const canFrame = !!allowed.qrFrameCustom;

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
      setInitialConfig({ ...data.config });
      setDefaults(data.defaults);
      setAllowed(data.allowedFeatures);
      setRestaurantName(data.restaurantName);
      setPrimaryColor(data.primaryColor);
      setSecondaryColor(data.secondaryColor);
      setLogoDataUrl(data.logoDataUrl);
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
          body: JSON.stringify({
            dark: config.dark,
            light: config.light,
            errorCorrection: config.errorCorrection,
          }),
        });
        if (token !== previewToken.current) return;
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
    setConfig((c) => ({ ...defaults, hasLogo: c?.hasLogo ?? false }));
    toast.success("Valores de diseño restablecidos");
  }

  async function handleLogoChange(hasLogo: boolean) {
    setConfig((c) => (c ? { ...c, hasLogo } : c));
    if (!restaurantId) return;
    if (!hasLogo) {
      setLogoDataUrl(null);
      return;
    }
    const res = await fetch(`/api/restaurant/${restaurantId}/qr/logo`);
    if (res.ok) {
      const d: { hasLogo: boolean; dataUrl?: string } = await res.json();
      setLogoDataUrl(d.dataUrl ?? null);
    }
  }

  async function handleSave() {
    if (!restaurantId || !config) return;
    if (!darkValid || !lightValid || !contrastOk) {
      toast.error("Corrige los errores de contraste antes de guardar");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/qr/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dark: config.dark,
          light: config.light,
          errorCorrection: config.errorCorrection,
          frameStyle: config.frameStyle,
        }),
      });
      if (res.ok) {
        toast.success("Diseño del generador publicado");
        setInitialConfig({ ...config });
      } else if (res.status === 429) {
        toast.error("Demasiados cambios — espera un momento");
      } else if (res.status === 403) {
        toast.error("Tu plan no incluye esta personalización");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de subida a servidores");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);
  let pendingCount = 0;
  if (config && initialConfig) {
     if (config.dark !== initialConfig.dark || config.light !== initialConfig.light) pendingCount++;
     if (config.errorCorrection !== initialConfig.errorCorrection) pendingCount++;
     if (config.frameStyle !== initialConfig.frameStyle) pendingCount++;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden -m-6 sm:-m-10">
      {/* Top Navigation */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0 z-10 w-full">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Configuración <span className="mx-1 text-gray-300">/</span> Diseño QR
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Deshacer diseño
          </button>
        </div>
      </div>

      {loading || !config ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50/50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden bg-gray-50/50 w-full">
          
          {/* Side Panel Editor */}
          <div className="w-[340px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shadow-sm z-10 hidden md:flex">
             {/* Sub Toolbar Tabs */}
             <div className="flex overflow-x-auto border-b border-gray-100 p-2 shrink-0 gap-1 hide-scrollbar">
                <EditorTab id="colors" icon={Palette} title="Colores" active={activeTab === "colors"} onClick={() => setActiveTab("colors")} />
                <EditorTab id="logo" icon={ImageIcon} title="Logo" active={activeTab === "logo"} onClick={() => setActiveTab("logo")} />
                <EditorTab id="frame" icon={LayoutTemplate} title="Marco" active={activeTab === "frame"} onClick={() => setActiveTab("frame")} />
                <EditorTab id="ec" icon={ShieldCheck} title="Corrección" active={activeTab === "ec"} onClick={() => setActiveTab("ec")} />
             </div>

             {/* Tab Content Area */}
             <div className="flex-1 overflow-y-auto p-6">
                
                {/* TOOL: COLORES */}
                {activeTab === "colors" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-gray-900">Paleta del QR</h3>
                      {!canColors && <ProBadge />}
                    </div>
                    
                    <div className="space-y-4">
                      <ColorField label="Color principal (Oscuro)" value={config.dark} onChange={(v) => updateField("dark", v)} disabled={!canColors} valid={darkValid} />
                      <ColorField label="Fondo (Claro)" value={config.light} onChange={(v) => updateField("light", v)} disabled={!canColors} valid={lightValid} />
                    </div>

                    {darkValid && lightValid && contrast !== null && (
                      <div className={`flex items-center gap-2 text-[12px] p-3 rounded-lg border ${contrastOk ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                        <div className={`w-2 h-2 rounded-full ${contrastOk ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span>Ratio de Contraste: {contrast.toFixed(1)}:1 {contrastOk ? "(Óptimo)" : "(Insuficiente)"}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Presets Rápidos</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {PRESETS.map(p => (
                          <button
                            key={p.name}
                            type="button"
                            disabled={!canColors}
                            onClick={() => { updateField("dark", p.dark); updateField("light", p.light); }}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Aplicar ${p.name}`}
                          >
                            <div className="w-12 h-12 rounded-full border border-gray-200 shadow-sm flex overflow-hidden group-hover:scale-105 transition-transform">
                              <div className="w-1/2 h-full" style={{ backgroundColor: p.dark }} />
                              <div className="w-1/2 h-full" style={{ backgroundColor: p.light }} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TOOL: LOGO */}
                {activeTab === "logo" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-gray-900">Embeber Logotipo</h3>
                      {!canLogo && <EnterpriseBadge />}
                    </div>

                    {canLogo ? (
                      <div className="bg-white">
                        <QrLogoUploader restaurantId={restaurantId!} onChange={handleLogoChange} />
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 text-blue-800 text-[12px]">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p>Subir un logo fuerza la configuración de corrección de errores al nivel &ldquo;Máximo&rdquo; (H) para evitar daños en el escaneo.</p>
                        </div>
                      </div>
                    ) : (
                      <LockBanner text="Agrega el isologotipo de tu marca al centro perfecto del código QR. Una marca imborrable en la mesa de tus comensales." />
                    )}
                  </div>
                )}

                {/* TOOL: FRAME */}
                {activeTab === "frame" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-gray-900">Marco de Impresión</h3>
                      {!canFrame && <EnterpriseBadge />}
                    </div>
                    
                    {canFrame ? (
                       <div className="space-y-4">
                          <p className="text-[13px] text-gray-500">Define el estilo arquitectónico de la lámina que descargas para tus mesas físicas.</p>
                          <QrFrameSelector value={config.frameStyle} onChange={(v) => updateField("frameStyle", v)} disabled={false} />
                       </div>
                    ) : (
                       <LockBanner text="Desbloquea plantillas arquitectónicas pre-diseñadas (Branded y Simples) para inyectar lujo a tus códigos de mesa A4 impresos." />
                    )}
                  </div>
                )}

                {/* TOOL: ERROR CORRECTION */}
                {activeTab === "ec" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-gray-900">Corrección de Daños</h3>
                      {!canEc && <ProBadge />}
                    </div>
                    
                    <p className="text-[13px] text-gray-500">Dictamina la redundancia matemática del patrón del QR. A mayor corrección, el código soporta más rayones y manchas sin volverse ilegible, pero los &ldquo;cuadritos&rdquo; se vuelven más pequeños y densos.</p>
                    
                    <div className="pt-4 pb-8 relative group">
                      <input 
                        type="range"
                        min="0"
                        max="3"
                        disabled={!canEc || config.hasLogo}
                        value={EC_LEVELS.indexOf(config.errorCorrection)}
                        onChange={(e) => updateField("errorCorrection", EC_LEVELS[parseInt(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between mt-2 text-[11px] font-bold text-gray-400">
                         <span>L</span>
                         <span>M</span>
                         <span>Q</span>
                         <span>H</span>
                      </div>
                      
                      <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 transition-colors">
                        <span className="block text-[13px] font-bold text-gray-900 mb-1">Nivel {config.errorCorrection} activo</span>
                        <span className="text-[13px] text-gray-600">{EC_LABELS[config.errorCorrection]}</span>
                      </div>
                    </div>
                  </div>
                )}

             </div>

          </div>

          {/* MAIN CANVAS */}
          <div className="flex-1 flex flex-col items-center relative overflow-hidden bg-[url('/bg-dots.svg')] bg-gray-50/50">
            {/* Canvas Toolbar View Toggle */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white border border-gray-200 shadow-sm rounded-full p-1 z-20">
               <button 
                 onClick={() => setPreviewMode("printable")}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${previewMode === "printable" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
               >
                 <Printer className="w-4 h-4" />
                 A4 Imprimible
               </button>
               <button 
                 onClick={() => setPreviewMode("mobile")}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${previewMode === "mobile" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
               >
                 <MonitorSmartphone className="w-4 h-4" />
                 Escaneo Móvil
               </button>
            </div>

            {/* ARTBOARD */}
            <div className={`flex-1 w-full flex items-center justify-center p-10 overflow-y-auto ${previewing ? "opacity-50 blur-[2px]" : "opacity-100 blur-none"} transition-all duration-300`}>
              <div 
                className="transform transition-all duration-700 origin-center drop-shadow-2xl hover:scale-105"
                style={{
                  width: previewMode === "printable" ? "400px" : "320px",
                }}
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-gray-200 to-gray-50 opacity-0 group-hover:opacity-100 rounded-[26px] blur-lg transition duration-700" />
                  <div className="relative">
                    {previewMode === "mobile" ? (
                      // Raw mockup for mobile scan
                      <div className="w-full aspect-square bg-white rounded-[24px] overflow-hidden p-8 shadow-md border border-gray-100 flex items-center justify-center relative">
                         <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />
                         {preview ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={preview} alt="Mobile Scan" className="w-[110%] h-[110%] object-contain mix-blend-multiply relative z-10" />
                         ) : (
                           <div className="w-full aspect-square bg-gray-200 animate-pulse rounded-xl" />
                         )}
                      </div>
                    ) : (
                      // Standard Frame Editor preview
                      <FramePreviewCard
                        qrDataUrl={preview}
                        frameStyle={config.frameStyle}
                        restaurantName={restaurantName}
                        tableLabel="Mesa Ej."
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        logoDataUrl={config.hasLogo ? logoDataUrl : null}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* FLOATING SAVE BUTTON */}
            {hasChanges && (
               <div className="absolute bottom-8 right-8 z-30 animate-in slide-in-from-bottom-6 fade-in duration-300">
                  <button
                    onClick={handleSave}
                    disabled={saving || !darkValid || !lightValid || !contrastOk}
                    className="flex items-center gap-3 bg-gray-900 border border-gray-800 shadow-2xl shadow-gray-900/20 text-white rounded-[16px] pl-4 pr-5 py-3 hover:bg-gray-800 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                         <Save className="w-4 h-4" />
                      </div>
                    )}
                    <div className="text-left">
                       <span className="block text-[14px] font-bold leading-none">Guardar diseño</span>
                       <span className="block text-[10px] text-white/70 mt-0.5">{pendingCount} configuración(es) pendiente(s)</span>
                    </div>
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── subcomponents ───────────────────────────────────────────────

function EditorTab({ icon: Icon, title, active, onClick }: { id?: string; icon: LucideIcon; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors focus:outline-none ${active ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
    >
      <Icon className="w-4 h-4" />
      {title}
    </button>
  );
}

function LockBanner({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 p flex flex-col gap-3 shadow-sm items-center text-center">
      <Lock className="w-8 h-8 text-gray-300" />
      <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
        {text}
      </p>
      <Link href="/settings/subscription" className="mt-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-[12px] font-bold hover:bg-gray-800 transition-colors">
        Ver planes y mejorar
      </Link>
    </div>
  );
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-widest">
      <Lock className="w-2.5 h-2.5" /> PRO
    </span>
  );
}

function EnterpriseBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800 uppercase tracking-widest">
      <Lock className="w-2.5 h-2.5" /> ENT
    </span>
  );
}

function ColorField({ label, value, onChange, disabled, valid }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean; valid: boolean; }) {
  const pickerValue = HEX_RE.test(value) ? value : "#000000";
  return (
    <div>
      <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors shadow-sm ${!valid ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white focus-within:border-gray-900"} ${disabled ? "opacity-60 bg-gray-50" : ""}`}>
        <div className="w-8 h-8 rounded-md relative overflow-hidden border border-gray-200 shrink-0 shadow-sm cursor-pointer hover:border-gray-400 transition-colors">
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute -inset-2 w-16 h-16 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          maxLength={7}
          className="flex-1 bg-transparent text-[14px] text-gray-900 font-bold font-mono outline-none disabled:cursor-not-allowed uppercase"
        />
      </div>
    </div>
  );
}

function computeContrast(a: string, b: string): number {
  const lA = luminance(a);
  const lB = luminance(b);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const rgb = [ parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16) ].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
