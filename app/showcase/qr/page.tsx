import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { QrActions } from "./qr-actions";

export const dynamic = "force-dynamic";

async function renderQr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    width: 520,
    color: {
      dark: "#2d1810",
      light: "#ffffff",
    },
  });
}

export default async function ShowcaseQrPage() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || "https://smart-checkout-omega.vercel.app";
  const url = `${base.replace(/\/$/, "")}/showcase`;
  const svg = await renderQr(url);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#fef3e2" }}
    >
      {/* Nav */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <Link
          href="/showcase"
          className="w-10 h-10 rounded-full bg-white border border-[#f4e4c8] flex items-center justify-center hover:bg-white/80 transition-colors shadow-sm"
          aria-label="Volver al showcase"
        >
          <ArrowLeft className="w-5 h-5 text-[#2d1810]" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Logo editorial */}
        <div className="text-center mb-8">
          <p
            style={{
              fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
              color: "#c8102e",
              fontSize: "52px",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            crepes & waffles
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a7866] font-medium mt-1.5">
            · escaneá desde tu celular ·
          </p>
        </div>

        {/* Card QR */}
        <div
          className="relative p-6 bg-white rounded-[32px] shadow-[0_20px_60px_rgba(45,24,16,0.12)]"
          style={{
            border: "2px solid rgba(212,165,116,0.35)",
          }}
        >
          <div
            className="w-[280px] h-[280px] md:w-[340px] md:h-[340px]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          {/* Badge superior — estilo editorial */}
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#fef3e2] border border-[#d4a574]/50 shadow-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            <span
              className="font-bold text-[#c8102e] text-[13px]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Crepes & Waffles
            </span>
          </div>

          {/* Label inferior */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="text-[13px] font-medium text-[#2d1810]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Mesa 12
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574]" />
            <span className="text-[12px] text-[#8a7866]">Cuenta abierta</span>
          </div>
        </div>

        {/* URL + acciones */}
        <div className="mt-8 w-full max-w-sm flex flex-col items-center gap-4">
          <div
            className="w-full px-4 py-3 rounded-2xl bg-white border border-[#f4e4c8] text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.28em] text-[#8a7866] mb-1.5 font-medium">
              URL
            </p>
            <p className="font-mono text-[12px] text-[#2d1810] break-all">
              {url}
            </p>
          </div>
          <QrActions url={url} />
        </div>

        {/* Guía + tarjeta sandbox */}
        <p className="mt-6 max-w-xs text-center text-[13px] text-[#8a7866] leading-relaxed">
          Apuntá la cámara y abrí el link. Podés pagar con tarjeta sandbox{" "}
          <span
            className="inline-block px-2 py-0.5 rounded-full bg-[#c8102e]/10 font-mono text-[#c8102e] font-semibold text-[12px]"
          >
            4242 4242 4242 4242
          </span>
          .
        </p>
      </div>
    </div>
  );
}
