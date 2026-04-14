"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function QrActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* silent */
    }
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d1810] text-white text-sm font-semibold hover:bg-[#1c0f0a] active:scale-[0.97] transition-all"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" strokeWidth={2.5} />
          Copiado
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" strokeWidth={2.2} />
          Copiar link
        </>
      )}
    </button>
  );
}
