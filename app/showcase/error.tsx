"use client";

import { useEffect } from "react";

export default function ShowcaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/showcase] Error capturado:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#fef3e2" }}
    >
      <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(45,24,16,0.1)]">
        <h1
          className="text-2xl font-bold text-[#c8102e] mb-2"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Algo salió mal en el showcase
        </h1>
        <p className="text-sm text-[#2d1810] mb-4">
          Detalle técnico (pegá esto si tenés que reportarlo):
        </p>
        <pre className="text-[11px] bg-[#fef3e2] border border-[#f4e4c8] rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words text-[#2d1810]">
          {error.message || "(sin mensaje)"}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          {error.stack ? `\n\n${error.stack}` : ""}
        </pre>
        <button
          onClick={reset}
          className="mt-4 w-full py-3 rounded-2xl bg-[#c8102e] text-white font-bold text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
