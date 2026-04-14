"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "payr.cookieConsent";
const CONSENT_VERSION = "1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== CONSENT_VERSION) setVisible(true);
    } catch {
      // localStorage bloqueado (modo privado/estricto) — no mostramos el banner
      // para evitar loop de re-render.
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, CONSENT_VERSION);
    } catch {
      // ignorar
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Política de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-[#e7e5e4] bg-white/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[#1c1410]">
          Usamos cookies estrictamente necesarias para mantener tu sesión y operar el
          servicio. No usamos cookies de publicidad ni analítica de terceros. Más
          detalle en nuestra{" "}
          <Link
            href="/cookies"
            className="font-medium text-[#c2410c] underline underline-offset-2 hover:text-[#9a3412]"
          >
            Política de Cookies
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex items-center justify-center rounded-full bg-[#1c1410] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3f2a24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
