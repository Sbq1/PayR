"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={copy}
      className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white overflow-hidden"
      style={{
        background: copied
          ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
          : "linear-gradient(135deg, #c8102e 0%, #a50d26 100%)",
        boxShadow: copied
          ? "0 6px 20px rgba(22,163,74,0.30)"
          : "0 6px 20px rgba(200,16,46,0.30)",
        transition: "background 0.3s, box-shadow 0.3s",
      }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            Copiado
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Copy className="w-4 h-4" strokeWidth={2.2} />
            Copiar link
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
