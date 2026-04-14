"use client";

import { useEffect, useState } from "react";
import { Loader2, Database, CreditCard, Crown, QrCode, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";

const settingsSections = [
  {
    title: "Diseño del QR",
    description: "Colores y personalización del código de mesa",
    href: "/settings/qr-design",
    icon: QrCode,
  },
  {
    title: "POS (Siigo)",
    description: "Credenciales de tu sistema de punto de venta",
    href: "/settings/pos",
    icon: Database,
  },
  {
    title: "Pagos (Wompi)",
    description: "Llaves de tu pasarela de pagos",
    href: "/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Suscripción",
    description: "Tu plan actual y opciones de mejora",
    href: "/settings/subscription",
    icon: Crown,
  },
];

export default function SettingsPage() {
  const { restaurantId } = useSession();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    name: "",
    slug: "",
  });
  const [initialForm, setInitialForm] = useState({
    name: "",
    slug: "",
  });

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        const payload = {
          name: r.name || "",
          slug: r.slug || "",
        };
        setForm(payload);
        setInitialForm(payload);
        setLoading(false);
      });
  }, [restaurantId]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!restaurantId || !form.name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Configuración actualizada con éxito");
        setInitialForm({ ...form }); 
      } else {
        const data = await res.json();
        toast.error(data.error || "Error guardando los datos");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-4 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-300 rounded-xl outline-none transition-shadow duration-200 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      {/* Header Jerárquico Premium */}
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-xl shadow-sm tracking-widest">
            {form.name.slice(0, 2).toUpperCase() || "RE"}
          </div>
        )}
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Configuración
          </h1>
          <p className="text-[14px] text-gray-500 mt-0.5">
            Administra los ajustes de tú restaurante y pasarelas de pago.
          </p>
        </div>
      </div>

      {/* Action Navigation Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {settingsSections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-4 p-5 rounded-[24px] bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors">
                <s.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors mt-2 mr-1" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 mb-1">{s.title}</p>
              <p className="text-[13px] text-gray-500 leading-normal">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* General Settings - 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[380px_1fr] gap-8 lg:gap-14 pt-10 border-t border-gray-100">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Ajustes Generales
          </h2>
          <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm">
            Tus datos principales en la plataforma. Tu nombre y slug definen cómo son creados los códigos QR que imprimes para las mesas. 
            Modificar el identificador de la URL afecta de forma vitalitia el enrutamiento.
          </p>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {loading ? (
             <div className="space-y-6 animate-pulse">
               <div className="h-20 bg-gray-50 rounded-xl" />
               <div className="h-20 bg-gray-50 rounded-xl" />
             </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <label className="text-[14px] font-semibold text-gray-900 block">
                  Nombre de tu restaurante
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Smart Checkout Bistro"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[14px] font-semibold text-gray-900 block">
                  Identificador (Slug)
                </label>
                <div className="flex items-center rounded-xl overflow-hidden border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-shadow">
                  <span className="text-[14px] text-gray-500 bg-gray-50 px-4 py-2.5 border-r border-gray-300 select-none">
                    smartcheckout.co/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="flex-1 px-4 py-2.5 text-[14px] text-gray-900 bg-white outline-none placeholder:text-gray-400 min-w-0"
                    placeholder="mi-restaurante"
                  />
                </div>

                <div className="mt-4 bg-amber-50 rounded-xl border border-amber-200/60 p-4 flex gap-3 text-amber-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5 ml-2" />
                  <div className="space-y-1">
                    <p className="text-[13px] font-bold tracking-tight">Cuidado al cambiar el slug</p>
                    <p className="text-[13px] text-amber-700/85 leading-snug">
                      Si ya imprimiste y colocaste códigos QR físicos que apuntan a tu slug actual (<strong className="font-semibold">{initialForm.slug || '...'}</strong>), al cambiar este dato los QRs físicos dejarán de funcionar y tendrás que imprimir nuevas plantillas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !hasChanges}
                  className="px-6 py-2.5 text-[14px] font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {hasChanges ? "Guardar cambios" : "Actualizado"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
