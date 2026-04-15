"use client";

import { useEffect, useState } from "react";

export default function ShowcaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[/showcase] Error capturado:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#fef3e2" }}
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        {/* Logo */}
        <div
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
            fontSize: "42px",
            lineHeight: 1,
          }}
        >
          crepes & waffles
        </div>

        {/* Card de error */}
        <div className="w-full bg-white rounded-[28px] p-6 shadow-[0_10px_40px_rgba(45,24,16,0.08)]">
          <h1
            className="text-2xl font-bold text-[#2d1810] mb-2"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Algo salió mal
          </h1>
          <p className="text-sm text-[#8a7866] mb-5 leading-relaxed">
            Ocurrió un error inesperado en el showcase. Si el problema persiste,
            compartí los detalles técnicos con el equipo.
          </p>

          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-[#8a7866] underline underline-offset-2 mb-3"
          >
            {showDetails ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}
          </button>

          {showDetails && (
            <pre className="text-[11px] bg-[#fef3e2] border border-[#f4e4c8] rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words text-[#2d1810] mb-4">
              {error.message || "(sin mensaje)"}
              {error.digest ? `\n\ndigest: ${error.digest}` : ""}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          )}

          <button
            onClick={reset}
            className="mt-2 w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #c8102e 0%, #a50d26 100%)",
              boxShadow: "0 6px 20px rgba(200,16,46,0.28)",
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
