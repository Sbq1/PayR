"use client";

import { QrCode } from "lucide-react";

export type QrFrameStyle = "none" | "simple" | "branded";

interface Option {
  value: QrFrameStyle;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    value: "none",
    title: "Sin frame",
    description: "Solo el código QR.",
  },
  {
    value: "simple",
    title: "Simple",
    description: "QR + mesa + CTA.",
  },
  {
    value: "branded",
    title: "Branded",
    description: "Logo + colores del restaurant.",
  },
];

export function QrFrameSelector({
  value,
  onChange,
  disabled,
}: {
  value: QrFrameStyle;
  onChange: (v: QrFrameStyle) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`group flex flex-col items-center gap-2 px-3 py-4 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FramePreview style={opt.value} active={active} />
            <div className="w-full text-center">
              <div className="text-[12px] font-semibold">{opt.title}</div>
              <div
                className={`text-[10px] mt-0.5 leading-tight ${
                  active ? "text-white/70" : "text-gray-500"
                }`}
              >
                {opt.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FramePreview({ style, active }: { style: QrFrameStyle; active: boolean }) {
  const qrColor = active ? "text-white/90" : "text-gray-400";
  const borderColor = active ? "border-white/40" : "border-gray-300";

  if (style === "none") {
    return (
      <div className="w-14 h-14 flex items-center justify-center">
        <QrCode className={`w-9 h-9 ${qrColor}`} strokeWidth={1.5} />
      </div>
    );
  }

  if (style === "simple") {
    return (
      <div
        className={`w-14 h-14 rounded-md border ${borderColor} flex flex-col items-center justify-center gap-0.5 p-1`}
      >
        <QrCode className={`w-7 h-7 ${qrColor}`} strokeWidth={1.5} />
        <div
          className={`w-6 h-0.5 rounded-full ${
            active ? "bg-white/40" : "bg-gray-300"
          }`}
        />
      </div>
    );
  }

  // branded
  return (
    <div
      className={`w-14 h-14 rounded-md border-[1.5px] ${
        active ? "border-white/60" : "border-indigo-400"
      } flex flex-col items-center justify-center gap-0.5 p-1`}
    >
      <div
        className={`w-5 h-1 rounded-full ${
          active ? "bg-white/50" : "bg-indigo-400"
        }`}
      />
      <QrCode className={`w-6 h-6 ${qrColor}`} strokeWidth={1.5} />
      <div
        className={`w-7 h-0.5 rounded-full ${
          active ? "bg-white/40" : "bg-gray-400"
        }`}
      />
    </div>
  );
}
