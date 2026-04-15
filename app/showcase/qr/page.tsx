/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { QrActions } from "./qr-actions";

export const dynamic = "force-dynamic";

async function renderQr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 480,
    color: {
      dark: "#3d1f0d",
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* ── Full-bleed nature background ── */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark botanical overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,8,4,0.55) 0%, rgba(15,8,4,0.35) 40%, rgba(15,8,4,0.65) 100%)",
          }}
        />
        {/* Warm tint */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(212,165,116,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Back button ── */}
      <div className="relative z-10 px-5 pt-5 pb-2">
        <Link
          href="/showcase"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" strokeWidth={2.2} />
        </Link>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 gap-6">

        {/* Logo C&W (SVG del hero) */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/showcase/cw-logo.svg"
            alt="Crepes & Waffles"
            className="h-[56px] w-auto object-contain"
            style={{ filter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
          />
          <p className="text-[10px] uppercase tracking-[0.32em] font-semibold text-white/50">
            · escaneá desde tu celular ·
          </p>
        </div>

        {/* ── QR glassmorphism card ── */}
        <div
          className="relative p-6 rounded-[32px]"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* Subtle inner glow top */}
          <div
            className="absolute inset-x-4 top-2 h-16 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(254,243,226,0.5) 0%, transparent 70%)",
            }}
          />

          <div className="relative w-[260px] h-[260px]">
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            {/* Logo center overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 4px 16px rgba(61,31,13,0.2)",
                  border: "2px solid rgba(212,165,116,0.3)",
                }}
              >
                <img
                  src="/showcase/crepes-logo.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Table info row */}
          <div className="mt-3 flex items-center justify-center gap-2.5">
            <span
              className="w-6 h-6 rounded-full bg-[#c8102e] text-white text-[10px] font-bold flex items-center justify-center"
            >
              12
            </span>
            <span
              className="text-[13px] font-semibold text-[#2d1810]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Mesa 12
            </span>
            <span className="w-px h-3 bg-[#d4a574]/40" />
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-[#8a7866]">Cuenta abierta</span>
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="w-full max-w-[300px] flex flex-col items-center gap-3">
          <QrActions url={url} />

          <div
            className="w-full px-4 py-2.5 rounded-2xl text-center"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <p className="font-mono text-[11px] text-white/60 break-all">{url}</p>
          </div>
        </div>

        <p className="max-w-[280px] text-center text-[13px] text-white/60 leading-relaxed">
          Apuntá la cámara y abrí el link. Podés pagar con tarjeta sandbox{" "}
          <span className="font-mono font-semibold text-[#fbbf24] whitespace-nowrap">
            4242 4242 4242 4242
          </span>
          .
        </p>
      </div>
    </div>
  );
}
