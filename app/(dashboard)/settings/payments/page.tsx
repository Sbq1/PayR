"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, Copy } from "lucide-react";
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
        toast.success("Llaves de Wompi guardadas");
        setHasCredentials(true);
        setForm({ wompiPublicKey: "", wompiPrivateKey: "", wompiEventsSecret: "", wompiIntegritySecret: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Error guardando");
      }
    } catch {
      toast.error("Error de red");
    }
    setSaving(false);
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada");
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900">Configuración de Pagos</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Conecta tu cuenta Wompi para recibir pagos reales
        </p>
      </div>

      {hasCredentials && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-700">
          <CheckCircle className="w-4 h-4" />
          Llaves configuradas. Ingresa nuevas para reemplazar.
        </div>
      )}

      {/* Webhook URL */}
      <div className="max-w-lg">
        <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
          URL de Webhook (configúrala en tu panel de Wompi)
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <span className="flex-1 px-3.5 py-2.5 text-[13px] text-gray-600 bg-gray-50 truncate">
            {webhookUrl || "Cargando..."}
          </span>
          <button
            onClick={copyWebhook}
            className="px-3 py-2.5 border-l border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Llave pública
          </label>
          <input
            type="text"
            value={form.wompiPublicKey}
            onChange={(e) => update("wompiPublicKey", e.target.value)}
            placeholder="pub_test_..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Llave privada
          </label>
          <input
            type="password"
            value={form.wompiPrivateKey}
            onChange={(e) => update("wompiPrivateKey", e.target.value)}
            placeholder="prv_test_..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Events secret
          </label>
          <input
            type="password"
            value={form.wompiEventsSecret}
            onChange={(e) => update("wompiEventsSecret", e.target.value)}
            placeholder="events_..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
            Integrity secret
          </label>
          <input
            type="password"
            value={form.wompiIntegritySecret}
            onChange={(e) => update("wompiIntegritySecret", e.target.value)}
            placeholder="integrity_..."
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.wompiPublicKey}
          className="px-4 py-2.5 mt-2 text-[14px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar llaves
        </button>
      </div>
    </div>
  );
}
