"use client";

import type { QrFrameStyle } from "./QrFrameSelector";

interface Props {
  qrDataUrl: string | null;
  frameStyle: QrFrameStyle;
  restaurantName: string;
  tableLabel: string;
  primaryColor: string;
  secondaryColor: string;
  logoDataUrl: string | null;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function safeHex(v: string, fallback: string): string {
  return HEX_RE.test(v) ? v : fallback;
}

export function FramePreviewCard({
  qrDataUrl,
  frameStyle,
  restaurantName,
  tableLabel,
  primaryColor,
  secondaryColor,
  logoDataUrl,
}: Props) {
  const primary = safeHex(primaryColor, "#4648d4");
  const secondary = safeHex(secondaryColor, "#6b38d4");

  if (!qrDataUrl) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-100 animate-pulse" />
    );
  }

  if (frameStyle === "none") {
    return (
      <div className="w-full aspect-square rounded-lg bg-white p-4 flex items-center justify-center border border-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Vista previa del QR"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (frameStyle === "simple") {
    return (
      <div className="w-full bg-white rounded-xl border-[1.5px] border-gray-900 p-4 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Vista previa del QR"
          className="w-full aspect-square object-contain"
        />
        <div className="text-center pb-1">
          <div className="text-[14px] font-bold text-gray-900">{tableLabel}</div>
          <div className="text-[11px] text-gray-600 mt-0.5">
            Escanea para pagar
          </div>
        </div>
      </div>
    );
  }

  // branded
  return (
    <div
      className="w-full bg-white rounded-xl p-4 flex flex-col items-center gap-2"
      style={{ border: `2px solid ${primary}` }}
    >
      {logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoDataUrl}
          alt="Logo"
          className="h-8 max-w-[100px] object-contain"
        />
      ) : (
        <div className="h-8 flex items-center text-[9px] uppercase tracking-widest text-gray-400">
          Sube tu logo
        </div>
      )}
      <div className="text-[10px] font-semibold text-gray-600 truncate max-w-full">
        {restaurantName}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="Vista previa del QR"
        className="w-full aspect-square object-contain"
      />
      <div className="text-[16px] font-bold" style={{ color: primary }}>
        {tableLabel}
      </div>
      <div className="text-[11px]" style={{ color: secondary }}>
        Escanea para pagar
      </div>
    </div>
  );
}
