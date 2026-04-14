"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export default function PosSettingsPage() {
  const { restaurantId } = useSession();
  const [username, setUsername] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const [showKey, setShowKey] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => setHasCredentials(r.hasSiigoCredentials));
  }, [restaurantId]);

  async function handleTest() {
    if (!restaurantId || !username || !accessKey) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/test-pos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, accessKey }),
      });
      setTestResult(res.ok ? "success" : "error");
      if (res.ok) toast.success("Conexión exitosa con Siigo");
      else {
        const data = await res.json();
        toast.error(data.error || "Error de autenticación con Siigo");
      }
    } catch {
      setTestResult("error");
      toast.error("Error al despachar la prueba HTTP");
    }
    setTesting(false);
  }

  async function handleSave() {
    if (!restaurantId || !username || !accessKey) return;
    if (hasCredentials) {
      if (
        !confirm(
          "¿Reemplazar las credenciales de Siigo actuales? Las anteriores dejarán de funcionar.",
        )
      )
        return;
    }
    setSaving(true);

    try {
      const res = await fetch(`/api/restaurant/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siigoUsername: username, siigoAccessKey: accessKey }),
      });
      if (res.ok) {
        toast.success("Credenciales cifradas y guardadas de forma segura");
        setHasCredentials(true);
        setUsername("");
        setAccessKey("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error guardando los tokens");
      }
    } catch {
      toast.error("Error de subida a servidores");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-4 py-3 text-[14px] text-gray-900 bg-white border border-gray-300 rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm";

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Punto de Venta (POS)</h1>
        <p className="text-[14px] text-gray-500 max-w-lg leading-relaxed">
          Sincroniza tus comandas. Conecta PayR a tu facturador colombiano Siigo para inyectar los cobros sin intervención humana.
        </p>
      </div>

      {/* Hero Status Card (Stripe Connect Style) */}
      <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors ${hasCredentials ? "bg-emerald-50/50 border-emerald-200" : "bg-amber-50/50 border-amber-200"}`}>
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${hasCredentials ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
               {hasCredentials ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
               <h2 className={`text-[15px] font-bold ${hasCredentials ? "text-emerald-900" : "text-amber-900"}`}>
                 {hasCredentials ? "Conectado a Siigo" : "No conectado a Siigo"}
               </h2>
               <p className={`text-[13px] mt-0.5 ${hasCredentials ? "text-emerald-700/80" : "text-amber-700/80"}`}>
                 {hasCredentials ? "Tus comandas apuntan a tu POS" : "PayR funciona independiente"}
               </p>
            </div>
         </div>
      </div>

      {/* Guided Steps */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        
        {/* Step 1 */}
        <div className="relative flex items-start gap-6 md:justify-center">
           <div className="hidden md:flex w-1/2 justify-end text-right pr-8">
              <div className="space-y-1 mt-1">
                 <h3 className="text-[15px] font-bold text-gray-900">1. Extraer llaves</h3>
                 <p className="text-[13px] text-gray-500 leading-snug break-words">Genera un token de uso en tu panel de Siigo Nube.</p>
              </div>
           </div>
           <div className="w-10 h-10 rounded-full font-bold text-white bg-gray-900 flex items-center justify-center shrink-0 z-10 shadow-md">1</div>
           <div className="flex-1 md:w-1/2 md:flex-none md:pl-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 mt-1">
                 <h3 className="md:hidden text-[14px] font-bold text-gray-900 mb-2">Paso 1: Generar Token</h3>
                 <p className="text-[13px] text-gray-600">Ingresa a tu cuenta de API de Siigo y solicita credenciales de producción para software externo.</p>
                 <a href="https://siigonube.siigo.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Ir al panel de Siigo <ChevronRight className="w-3.5 h-3.5" />
                 </a>
              </div>
           </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex items-start gap-6 md:justify-center">
           <div className="hidden md:flex w-1/2 justify-end text-right pr-8">
              <div className="space-y-1 mt-1">
                 <h3 className="text-[15px] font-bold text-gray-900">2. Enlazar PayR</h3>
                 <p className="text-[13px] text-gray-500 leading-snug">Inyecta tus keys debajo de forma segura.</p>
              </div>
           </div>
           <div className="w-10 h-10 rounded-full font-bold text-gray-500 bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0 z-10 shadow-sm">2</div>
           <div className="flex-1 md:w-1/2 md:flex-none md:pl-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-1">
                 {/* AES Warning */}
                 <div className="flex gap-2.5 items-start bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mb-6">
                    <ShieldCheck className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
                    <p className="text-[12px] text-indigo-900/80 leading-relaxed font-medium">Tus credenciales de Siigo se cifran militarmente en bloque (AES-256) antes de almacenarse. Nadie en PayR, ni los ingenieros, pueden leerlas en texto plano.</p>
                 </div>

                 <div className="space-y-5">
                    <div>
                      <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">
                        Siigo Usuario API
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="tu-correo@empresa.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">
                        Siigo Access Key
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••"
                          className={`${inputClass} pr-12`}
                        />
                        <button 
                           type="button" 
                           onClick={() => setShowKey(!showKey)} 
                           className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                        >
                           {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSave}
                      disabled={saving || !username || !accessKey}
                      className="w-full px-4 py-3 text-[14px] font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {hasCredentials ? "Reemplazar credenciales" : "Guardar credenciales seguras"}
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex items-start gap-6 md:justify-center">
           <div className="hidden md:flex w-1/2 justify-end text-right pr-8">
              <div className="space-y-1 mt-1">
                 <h3 className="text-[15px] font-bold text-gray-900">3. Validar</h3>
                 <p className="text-[13px] text-gray-500 leading-snug">Testea el Handshake.</p>
              </div>
           </div>
           <div className="w-10 h-10 rounded-full font-bold text-gray-500 bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0 z-10 shadow-sm">3</div>
           <div className="flex-1 md:w-1/2 md:flex-none md:pl-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-1">
                 
                 <div className="flex items-center justify-between mb-4">
                    <label className="text-[14px] font-bold text-gray-900">Modo de Prueba Local</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={demoMode} onChange={() => setDemoMode(!demoMode)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                 </div>

                 {testResult && (
                   <div className={`mb-4 flex gap-3 p-4 rounded-xl border text-[13px] leading-relaxed ${testResult === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                     {testResult === "success" ? (
                       <><CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" /> <div><strong>Prueba Exitosa.</strong> PayR logró simular una orden vacía hacia tu instancia de Siigo usando las keys provistas. Todo en línea.</div></>
                     ) : (
                       <><AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" /> <div><strong>Fallo de Red.</strong> Asegúrate de que las API Keys concuerden con los permisos contables y no tengan espacios residuales.</div></>
                     )}
                   </div>
                 )}

                 <button
                   onClick={handleTest}
                   disabled={testing || !username || !accessKey}
                   className="w-full px-4 py-3 text-[14px] font-bold text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                 >
                   {testing ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <Play className="w-4 h-4 text-gray-500 fill-gray-500" />}
                   Ejecutar Ping a Siigo
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
