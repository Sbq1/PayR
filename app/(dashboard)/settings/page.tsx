"use client";

import { useEffect, useState } from "react";
import { Loader2, Store, Database, CreditCard, Crown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";

const settingsSections = [
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
  const [form, setForm] = useState({
    name: "",
    slug: "",
    primaryColor: "#6366f1",
    secondaryColor: "#f59e0b",
    backgroundColor: "#ffffff",
  });

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/restaurant/${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        setForm({
          name: r.name || "",
          slug: r.slug || "",
          primaryColor: r.primaryColor || "#6366f1",
          secondaryColor: r.secondaryColor || "#f59e0b",
          backgroundColor: r.backgroundColor || "#ffffff",
        });
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
      if (res.ok) toast.success("Configuración guardada");
      else {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900">Configuración</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Administra tu restaurante y conexiones
        </p>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {settingsSections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
          >
            <div className="p-2 rounded-lg bg-gray-100">
              <s.icon className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-900">{s.title}</p>
              <p className="text-[12px] text-gray-500">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* General form */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
              Nombre del restaurante
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
              Slug (URL)
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
              <span className="text-[13px] text-gray-400 bg-gray-50 px-3 py-2.5 border-r border-gray-300 whitespace-nowrap">
                smartcheckout.co/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                className="flex-1 px-3 py-2.5 text-[14px] text-gray-900 bg-white outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Primario", field: "primaryColor" },
              { label: "Secundario", field: "secondaryColor" },
              { label: "Fondo", field: "backgroundColor" },
            ].map((c) => (
              <div key={c.field}>
                <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                  {c.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[c.field as keyof typeof form]}
                    onChange={(e) => update(c.field, e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form[c.field as keyof typeof form]}
                    onChange={(e) => update(c.field, e.target.value)}
                    className="flex-1 px-2 py-1.5 text-[13px] text-gray-700 bg-white border border-gray-300 rounded-lg outline-none focus:border-gray-900"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="px-4 py-2.5 mt-2 text-[14px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
