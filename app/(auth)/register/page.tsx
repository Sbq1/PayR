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
    <div className="w-full fade-in-up">
      {/* Heading */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="font-serif text-[32px] font-black tracking-tight text-[#1c1410] mb-2">
          Empieza gratis
        </h1>
        <p className="text-[15px] font-medium text-[#78716c]">
          Registra tu restaurante y cobra en minutos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">
        {error && (
          <div className="flex items-center gap-3 text-[14px] text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Row 1: Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="flex flex-col">
            <label htmlFor="reg-name" className="text-[13px] font-bold text-[#1c1410] mb-1.5 ml-1">
              Nombre completo
            </label>
            <input
              type="text"
              id="reg-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
              autoComplete="name"
              className="w-full bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 outline-none focus:border-[#c2410c] focus:ring-4 focus:ring-[#c2410c]/10 transition-all text-[#1c1410] placeholder:text-[#a8a29e]"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="reg-email" className="text-[13px] font-bold text-[#1c1410] mb-1.5 ml-1">
              Correo electrónico
            </label>
            <input
              type="email"
              id="reg-email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
              className="w-full bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 outline-none focus:border-[#c2410c] focus:ring-4 focus:ring-[#c2410c]/10 transition-all text-[#1c1410] placeholder:text-[#a8a29e]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label htmlFor="reg-password" className="text-[13px] font-bold text-[#1c1410] mb-1.5 ml-1">
            Contraseña <span className="font-normal text-[#a8a29e] ml-1">(mín 8 caracteres)</span>
          </label>
          <input
            type="password"
            id="reg-password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 outline-none focus:border-[#c2410c] focus:ring-4 focus:ring-[#c2410c]/10 transition-all text-[#1c1410] placeholder:text-[#a8a29e] tracking-widest"
          />
        </div>

        <div className="pt-4 border-t border-[#e7e5e4]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#c2410c]/10 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-[#c2410c]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1c1410]">Datos del local</h3>
          </div>
          
          {/* Restaurant name */}
          <div className="flex flex-col mb-4">
            <label htmlFor="reg-restaurant" className="text-[13px] font-bold text-[#1c1410] mb-1.5 ml-1">
              Nombre del restaurante
            </label>
            <input
              type="text"
              id="reg-restaurant"
              value={form.restaurantName}
              onChange={(e) => updateField("restaurantName", e.target.value)}
              placeholder="Ej. El Buen Sabor"
              required
              className="w-full bg-[#fcfcff] border border-[#e7e5e4] rounded-xl px-4 py-3.5 outline-none focus:border-[#c2410c] focus:ring-4 focus:ring-[#c2410c]/10 transition-all text-[#1c1410] placeholder:text-[#a8a29e]"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col">
            <div className="flex items-center border border-[#e7e5e4] rounded-xl overflow-hidden transition-all duration-300 focus-within:border-[#c2410c] focus-within:ring-4 focus-within:ring-[#c2410c]/10 bg-[#f5f5f4] focus-within:bg-white shadow-sm">
              <span className="text-[14px] text-[#78716c] px-4 py-3.5 border-r border-[#e7e5e4] select-none whitespace-nowrap">
                smartcheckout.co/
              </span>
              <input
                type="text"
                id="reg-slug"
                value={form.restaurantSlug}
                onChange={(e) => updateField("restaurantSlug", e.target.value)}
                placeholder="el-buen-sabor"
                required
                className="flex-1 px-4 py-3.5 text-[14px] text-[#1c1410] bg-transparent outline-none placeholder:text-[#a8a29e] min-w-0"
              />
            </div>
            <p className="text-[12px] text-[#a8a29e] font-medium mt-2 ml-1">
              Esta será la URL pública donde tus clientes verán el menú.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-4 rounded-xl font-bold text-[16px] text-white bg-[#c2410c] hover:bg-[#a3360a] shadow-[0_4px_16px_rgba(194,65,12,0.25)] hover:shadow-[0_6px_20px_rgba(194,65,12,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] group"
        >
          {loading ? (
             <>
               <Loader2 className="w-5 h-5 animate-spin" />
               Creando cuenta...
             </>
          ) : (
             <>
               Crear cuenta y continuar
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </>
          )}
        </button>
      </form>

      {/* Terms */}
      <p className="mt-5 text-[12.5px] text-[#78716c] text-center leading-relaxed">
        Al continuar, aceptas nuestros{" "}
        <a href="#" className="font-bold text-[#1c1410] underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c] transition-colors">
          Términos de servicio
        </a>{" "}
        y{" "}
        <a href="#" className="font-bold text-[#1c1410] underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c] transition-colors">
          Política de privacidad
        </a>.
      </p>

      {/* Divider */}
      <div className="mt-8 pt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e7e5e4]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-[#78716c] font-medium bg-white">¿Ya te registraste?</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-[#1c1410] font-bold hover:text-[#c2410c] transition-colors inline-block underline underline-offset-4 decoration-[#e7e5e4] hover:decoration-[#c2410c]"
        >
          Iniciar sesión &rarr;
        </Link>
      </div>
    </div>
  );
}
