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
      <div className="w-full aspect-[320/460] bg-white rounded-[20px] border border-gray-200 p-8 flex flex-col items-center justify-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Vista previa del QR"
          className="w-[70%] aspect-square object-contain mb-8"
        />
        <div className="text-center w-full">
          <div className="text-[20px] font-bold text-gray-900 mb-1 truncate">{tableLabel}</div>
          <div className="text-[14px] text-gray-500 font-medium">
            Escanea para pagar
          </div>
        </div>
      </div>
    );
  }

  // branded
  return (
    <div className="w-full bg-white rounded-[24px] border border-gray-200 px-6 py-8 flex flex-col items-center shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: primary }} />
      
      {logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoDataUrl}
          alt="Logo"
          className="h-[44px] max-w-[140px] object-contain mt-2 mb-3"
        />
      ) : (
        <div className="h-[44px] mt-2 mb-3 flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-400 font-medium bg-gray-50 rounded-lg px-4 border border-gray-100 border-dashed">
          Sube tu logo
        </div>
      )}
      
      <div className="text-[14px] font-bold text-gray-900 truncate max-w-full mb-5">
        {restaurantName}
      </div>

      <div className="w-[85%] aspect-square bg-gray-50 rounded-[20px] border border-gray-100 p-4 mb-8 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Vista previa del QR"
          className="w-[90%] h-[90%] object-contain mix-blend-multiply"
        />
      </div>

      <div className="text-[26px] leading-tight font-bold mb-2 truncate w-full text-center" style={{ color: primary }}>
        {tableLabel}
      </div>
      <div className="text-[14px] font-medium" style={{ color: secondary }}>
        Escanea para pagar
      </div>
    </div>
  );
}
