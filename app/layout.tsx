import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Checkout — Paga tu cuenta con QR",
  description:
    "Sistema de pago QR para restaurantes. Escanea, ve tu cuenta y paga sin esperas.",
  metadataBase: new URL("https://smart-checkout-omega.vercel.app"),
  openGraph: {
    title: "Smart Checkout — Paga tu cuenta con QR",
    description:
      "Sistema de pago QR para restaurantes. Escanea, ve tu cuenta y paga sin esperas.",
    url: "https://smart-checkout-omega.vercel.app",
    siteName: "Smart Checkout",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Checkout — Paga tu cuenta con QR",
    description:
      "Sistema de pago QR para restaurantes. Escanea, ve tu cuenta y paga sin esperas.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
