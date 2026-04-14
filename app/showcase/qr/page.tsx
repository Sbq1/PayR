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
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <Link
          href="/showcase"
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-[#f4e4c8] flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Volver al showcase"
          style={{ WebkitBackdropFilter: "blur(8px)" }}
        >
          <ArrowLeft className="w-5 h-5 text-[#2d1810]" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="text-center mb-6">
          <p
            className="text-3xl leading-none mb-1"
            style={{
              fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
              color: "#c8102e",
            }}
          >
            escaneá para probar
          </p>
          <p className="text-xs uppercase tracking-[0.28em] text-[#8a7866] font-semibold">
            · desde tu celular ·
          </p>
        </div>

        <div
          className="relative p-6 bg-white rounded-[32px] shadow-[0_20px_60px_rgba(45,24,16,0.12)] border border-[#f4e4c8]"
        >
          <div
            className="w-[280px] h-[280px] md:w-[340px] md:h-[340px]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#c8102e] text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
            Crepes & Waffles
          </div>

          <p
            className="text-center mt-4 text-xs text-[#8a7866]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Mesa 12 · Cuenta abierta
          </p>
        </div>

        <div className="mt-8 w-full max-w-sm flex flex-col items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#8a7866] mb-1">
              URL
            </p>
            <p className="font-mono text-xs text-[#2d1810] break-all">
              {url}
            </p>
          </div>
          <QrActions url={url} />
        </div>

        <p className="mt-8 max-w-xs text-center text-xs text-[#8a7866] leading-relaxed">
          Apuntá la cámara y abrí el link. Podés pagar con tarjeta sandbox{" "}
          <span className="font-mono text-[#c8102e] font-semibold">4242 4242 4242 4242</span>
          .
        </p>
      </div>
    </div>
  );
}
