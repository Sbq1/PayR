"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, Copy, AlertTriangle, EyeOff, Eye, ExternalLink, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export default function PaymentSettingsPage() {
  const { restaurantId } = useSession();
  const [hasCredentials, setHasCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    wompiPublicKey: "",
    wompiPrivateKey: "",
    wompiEventsSecret: "",
    wompiIntegritySecret: "",
  });

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showEventsKey, setShowEventsKey] = useState(false);
  const [showIntegrityKey, setShowIntegrityKey] = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/payment/webhook`
    : "";

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => setHasCredentials(r.hasWompiCredentials));
  }, [restaurantId]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!restaurantId || !form.wompiPublicKey) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Llaves de Wompi cifradas y guardadas");
        setHasCredentials(true);
        setForm({ wompiPublicKey: form.wompiPublicKey, wompiPrivateKey: "", wompiEventsSecret: "", wompiIntegritySecret: "" }); // keep public key visible, clear secrets on success
      } else {
        const data = await res.json();
        toast.error(data.error || "Error guardando tokens");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setSaving(false);
  }

  function copyText(val: string) {
    if (!val) return;
    navigator.clipboard.writeText(val);
    toast.success("Copiado al portapapeles");
  }

  const isProd = form.wompiPublicKey.startsWith("pub_prod_");
  const isSandbox = form.wompiPublicKey.startsWith("pub_test_");

  const isProdKey = (k: string) => k.includes("prod_");
  const isTestKey = (k: string) => k.includes("test_");

  const hasMixedEnvs = 
     (isProd && (isTestKey(form.wompiPrivateKey) || isTestKey(form.wompiEventsSecret) || isTestKey(form.wompiIntegritySecret))) ||
     (isSandbox && (isProdKey(form.wompiPrivateKey) || isProdKey(form.wompiEventsSecret) || isProdKey(form.wompiIntegritySecret)));

  const inputClass =
    "w-full px-4 py-3 text-[14px] text-gray-900 bg-white border border-gray-300 rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Pasarela de Pagos</h1>
        <p className="text-[14px] text-gray-500 max-w-lg leading-relaxed">
          Conecta Bancolombia Wompi de forma directa. Dirige pagos 100% legales y tributarios bajo la titularidad del restaurante.
        </p>
      </div>

      {hasCredentials && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] font-medium text-emerald-800">
          <CheckCircle className="w-5 h-5" />
          Gateway configurado. Listo para procesar cobros automáticos.
        </div>
      )}

      {/* Hero Status Card */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-sm transition-colors ${
         !form.wompiPublicKey ? "bg-gray-50 border-gray-200" :
         isProd ? "bg-emerald-50 border-emerald-200" :
         isSandbox ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
      }`}>
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
               !form.wompiPublicKey ? "bg-gray-200 text-gray-400" :
               isProd ? "bg-emerald-100 text-emerald-600" :
               "bg-amber-100 text-amber-600"
            }`}>
               {!form.wompiPublicKey ? <ShieldAlert className="w-6 h-6" /> : isProd ? <Zap className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
               <h2 className={`text-[16px] font-bold tracking-tight ${
                  !form.wompiPublicKey ? "text-gray-700" :
                  isProd ? "text-emerald-900" :
                  "text-amber-900"
               }`}>
                  {!form.wompiPublicKey ? "Ingresa tu Llave Pública para detectar entorno" : isProd ? "Wompi Producción" : "Wompi Sandbox (Test)"}
               </h2>
               <p className={`text-[13px] mt-0.5 leading-snug font-medium ${
                  !form.wompiPublicKey ? "text-gray-500" :
                  isProd ? "text-emerald-700/90" :
                  "text-amber-800/80"
               }`}>
                  {isProd 
                    ? "ATENCIÓN: Tu cuenta está ligada a procesamiento de fondos y tarjetas reales." 
                    : "Modo simulacro activo. Los pagos no moverán dinero ni facturarán."}
               </p>
            </div>
         </div>

         <a 
           href="https://comercios.wompi.co/developers" 
           target="_blank" 
           rel="noreferrer"
           className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0 shadow-sm"
         >
            Dashboard Wompi <ExternalLink className="w-4 h-4" />
         </a>
      </div>

      {hasMixedEnvs && (
         <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="space-y-1">
               <h4 className="text-[14px] font-bold text-red-900">Entornos de Tokens Mezclados</h4>
               <p className="text-[13px] text-red-800/90 leading-relaxed">Tu llave pública es de un entorno, pero parece que ingresaste llaves privadas del otro entorno (test/prod). Wompi denegará todas las peticiones con Error 401 si cortas y pegas de paneles diferentes.</p>
            </div>
         </div>
      )}

      {/* Secrets Container */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
         
         <div className="space-y-6">
            <div>
               <h3 className="text-lg font-bold text-gray-900 tracking-tight">1. Llave Pública</h3>
               <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Las llaves públicas (Public Key) sirven para crear intenciones de pago y pueden ser expuestas en el checkout sin ningún riesgo económico.</p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
               <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">
                  Public Key de Wompi
               </label>
               <div className="flex items-center gap-2">
                 <input
                   type="text"
                   value={form.wompiPublicKey}
                   onChange={(e) => update("wompiPublicKey", e.target.value.trim())}
                   placeholder="pub_prod_XoXo..."
                   className={inputClass}
                 />
                 <button onClick={() => copyText(form.wompiPublicKey)} className="shrink-0 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900" title="Copiar Pública">
                    <Copy className="w-5 h-5 text-gray-600" />
                 </button>
               </div>
               {form.wompiPublicKey && !form.wompiPublicKey.startsWith("pub_") && (
                  <p className="text-[12px] text-amber-600 mt-2 font-medium">Debería empezar por &ldquo;pub_test_&rdquo; o &ldquo;pub_prod_&rdquo;</p>
               )}
            </div>
            
            {/* Action Save Button Below Public Key */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.wompiPublicKey || !form.wompiPrivateKey}
                className="w-full px-4 py-3.5 text-[14px] font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Integración
              </button>
            </div>
         </div>

         <div className="space-y-6">
            <div>
               <h3 className="text-lg font-bold text-gray-900 tracking-tight">2. Secretos del Servidor</h3>
               <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Toda información privada insertada aquí será cifrada simétricamente hacia la base de datos de PayR.</p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                  <ShieldAlert className="w-24 h-24 text-gray-900" />
               </div>

               <div className="relative z-10">
                 <label className="text-[13px] font-bold text-gray-900 block">
                   Private Key
                 </label>
                 <p className="text-[12px] text-gray-500 mb-2">Firmará las órdenes que viajen a la pasarela.</p>
                 <div className="relative">
                   <input
                     type={showPrivateKey ? "text" : "password"}
                     value={form.wompiPrivateKey}
                     onChange={(e) => update("wompiPrivateKey", e.target.value.trim())}
                     placeholder="prv_..."
                     className={`${inputClass} pr-12`}
                   />
                   <button type="button" onClick={() => setShowPrivateKey(!showPrivateKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors focus:outline-none">
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
               </div>

               <div className="relative z-10 border-t border-gray-100 pt-5">
                 <label className="text-[13px] font-bold text-gray-900 block">
                   Events Secret
                 </label>
                 <p className="text-[12px] text-gray-500 mb-2">Para descifrar los Webhooks que envíe Bancolombia.</p>
                 <div className="relative">
                   <input
                     type={showEventsKey ? "text" : "password"}
                     value={form.wompiEventsSecret}
                     onChange={(e) => update("wompiEventsSecret", e.target.value.trim())}
                     placeholder="events_..."
                     className={`${inputClass} pr-12`}
                   />
                   <button type="button" onClick={() => setShowEventsKey(!showEventsKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors focus:outline-none">
                      {showEventsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
                 </div>
               </div>

               <div className="relative z-10 border-t border-gray-100 pt-5">
                 <label className="text-[13px] font-bold text-gray-900 block">
                   Integrity Secret
                 </label>
                 <p className="text-[12px] text-gray-500 mb-2">Corrobora criptográficamente los montos de la transacción terminal.</p>
                 <div className="relative">
                   <input
                     type={showIntegrityKey ? "text" : "password"}
                     value={form.wompiIntegritySecret}
                     onChange={(e) => update("wompiIntegritySecret", e.target.value.trim())}
                     placeholder="prod_integrity_..."
                     className={`${inputClass} pr-12`}
                   />
                   <button type="button" onClick={() => setShowIntegrityKey(!showIntegrityKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors focus:outline-none">
                      {showIntegrityKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* Webhook Configuration Guide */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 lg:p-8">
         <h3 className="text-[15px] font-bold text-blue-900">Configuración Final: Notificaciones Webhook</h3>
         <p className="text-[13px] text-blue-800/80 mt-1 mb-6 max-w-2xl">
           Bancolombia Wompi requiere que le indiques a qué URL enviar la confirmación del pago cuando el cajero u operador verifique que fue cobrado. Ve al apartado de Webhooks en tu portal de Wompi de comercio y pega este enlace de retrollamada:
         </p>
         
         <div className="flex flex-col sm:flex-row gap-3">
           <div className="flex items-center bg-white border border-blue-200 rounded-xl overflow-hidden flex-1 shadow-sm">
             <span className="flex-1 px-4 py-3 text-[14px] font-mono text-blue-900 truncate bg-transparent selection:bg-blue-100">
               {webhookUrl || "Cargando..."}
             </span>
             <button
               onClick={() => copyText(webhookUrl)}
               className="px-4 py-3 border-l border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold text-[13px]"
             >
               Copiar
             </button>
           </div>
           
           <button disabled className="px-5 py-3 rounded-xl bg-white border border-blue-200 text-[13px] font-bold text-gray-400 cursor-not-allowed shadow-sm shrink-0">
              Prueba Wompi pronto
           </button>
         </div>
      </div>

    </div>
  );
}
