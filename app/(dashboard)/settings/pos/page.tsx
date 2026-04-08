"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
        toast.error(data.error || "Error de conexión");
      }
    } catch {
      setTestResult("error");
      toast.error("Error de red");
    }
    setTesting(false);
  }

  async function handleSave() {
    if (!restaurantId || !username || !accessKey) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/restaurant/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siigoUsername: username, siigoAccessKey: accessKey }),
      });
      if (res.ok) {
        toast.success("Credenciales guardadas");
        setHasCredentials(true);
        setUsername("");
        setAccessKey("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error guardando");
      }
    } catch {
      toast.error("Error de red");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900">Configuración POS</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Conecta tu sistema Siigo para leer comandas automáticamente
        </p>
      </div>

      {hasCredentials && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-700">
          <CheckCircle className="w-4 h-4" />
          Credenciales configuradas. Ingresa nuevas para reemplazar.
        </div>
      )}

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Usuario Siigo
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tu-usuario@empresa.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Access Key
          </label>
          <input
            type="password"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="••••••••••••••••"
            className={inputClass}
          />
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-[13px] ${
              testResult === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {testResult === "success" ? (
              <><CheckCircle className="w-4 h-4" /> Conexión exitosa</>
            ) : (
              <><AlertCircle className="w-4 h-4" /> Error de conexión — verifica tus credenciales</>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing || !username || !accessKey}
            className="px-4 py-2.5 text-[14px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            Probar conexión
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !username || !accessKey}
            className="px-4 py-2.5 text-[14px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar credenciales
          </button>
        </div>
      </div>
    </div>
  );
}
