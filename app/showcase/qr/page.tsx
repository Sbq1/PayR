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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#fef3e2" }}
    >
      <div className="px-5 pt-5 pb-2">
        <Link
          href="/showcase"
          className="w-10 h-10 rounded-full bg-white border border-[#f4e4c8] flex items-center justify-center hover:bg-[#fdf0e0] transition-colors shadow-sm"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-[#2d1810]" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 gap-7">

        {/* Logo real C&W */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-28 h-28 rounded-full overflow-hidden shadow-[0_12px_40px_rgba(61,31,13,0.22)]"
            style={{ border: "4px solid #fff" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase/crepes-logo.jpg"
              alt="Crepes & Waffles"
              className="w-full h-full object-cover"
            />
          </div>
          <p
            className="text-[10px] uppercase tracking-[0.32em] font-semibold"
            style={{ color: "#8a7866" }}
          >
            · escaneá desde tu celular ·
          </p>
        </div>

        {/* Card QR con logo superpuesto */}
        <div
          className="relative p-6 rounded-[36px]"
          style={{
            background: "#ffffff",
            boxShadow: "0 24px 64px rgba(61,31,13,0.14), 0 2px 8px rgba(61,31,13,0.06)",
            border: "1.5px solid rgba(212,165,116,0.3)",
          }}
        >
          <div className="relative w-[280px] h-[280px]">
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            {/* Logo en el centro del QR */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-16 h-16 rounded-full overflow-hidden"
                style={{
                  border: "3px solid #ffffff",
                  boxShadow: "0 2px 12px rgba(61,31,13,0.25)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/showcase/crepes-logo.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="text-[13px] font-semibold text-[#2d1810]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Mesa 12
            </span>
            <span className="w-1 h-1 rounded-full bg-[#d4a574]" />
            <span className="text-[12px] text-[#8a7866]">Cuenta abierta</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="w-full max-w-[320px] flex flex-col items-center gap-3">
          <QrActions url={url} />

          <div
            className="w-full px-4 py-2.5 rounded-2xl text-center"
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(212,165,116,0.3)",
            }}
          >
            <p className="font-mono text-[11px] text-[#8a7866] break-all">{url}</p>
          </div>
        </div>

        <p className="max-w-[280px] text-center text-[13px] text-[#8a7866] leading-relaxed">
          Apuntá la cámara y abrí el link. Podés pagar con tarjeta sandbox{" "}
          <span className="font-mono font-semibold text-[#c8102e] whitespace-nowrap">
            4242 4242 4242 4242
          </span>
          .
        </p>
      </div>
    </div>
  );
}
