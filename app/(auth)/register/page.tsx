"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight, Store } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: "",
    restaurantSlug: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "restaurantName") {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((prev) => ({ ...prev, restaurantSlug: slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="w-full animation-fade-in">
      {/* Heading */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
          Empieza gratis
        </h1>
        <p className="text-[15px] font-medium text-gray-500">
          Registra tu restaurante y cobra en minutos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 text-[14px] text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Row 1: Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="floating-label-group">
            <input
              type="text"
              id="reg-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder=" "
              required
              autoComplete="name"
            />
            <label htmlFor="reg-name">Nombre completo</label>
          </div>

          {/* Email */}
          <div className="floating-label-group">
            <input
              type="email"
              id="reg-email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder=" "
              required
              autoComplete="email"
            />
            <label htmlFor="reg-email">Correo electrónico</label>
          </div>
        </div>

        {/* Password */}
        <div className="floating-label-group">
          <input
            type="password"
            id="reg-password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder=" "
            required
            autoComplete="new-password"
            minLength={6}
          />
          <label htmlFor="reg-password">Contraseña (mínimo 6 caracteres)</label>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700">Datos del local</h3>
          </div>
          
          {/* Restaurant name */}
          <div className="floating-label-group mb-4">
            <input
              type="text"
              id="reg-restaurant"
              value={form.restaurantName}
              onChange={(e) => updateField("restaurantName", e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="reg-restaurant">Nombre del restaurante</label>
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 bg-gray-50 focus-within:bg-white shadow-sm">
              <span className="text-[14px] text-gray-500 px-4 py-3 border-r border-gray-200 select-none whitespace-nowrap bg-gray-100/50">
                smartcheckout.co/
              </span>
              <input
                type="text"
                id="reg-slug"
                value={form.restaurantSlug}
                onChange={(e) => updateField("restaurantSlug", e.target.value)}
                placeholder="tu-restaurante"
                required
                className="flex-1 px-4 py-3 text-[14px] text-gray-900 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
              />
            </div>
            <p className="text-[12px] text-gray-400 font-medium mt-2">
              Esta será la URL donde tus clientes verán el menú/cuenta.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3.5 rounded-xl font-bold text-[15px] text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear cuenta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Terms */}
      <p className="mt-5 text-[12.5px] text-gray-400 text-center leading-relaxed">
        Al continuar, aceptas nuestros{" "}
        <a href="#" className="font-medium text-gray-500 underline underline-offset-2 hover:text-indigo-600 transition-colors">
          Términos de servicio
        </a>{" "}
        y{" "}
        <a href="#" className="font-medium text-gray-500 underline underline-offset-2 hover:text-indigo-600 transition-colors">
          Política de privacidad
        </a>.
      </p>

      {/* Divider */}
      <div className="mt-8 pt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-gray-500 bg-white">¿Ya tienes cuenta?</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-gray-900 font-bold hover:text-indigo-600 transition-colors inline-block"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
