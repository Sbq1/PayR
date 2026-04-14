import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsent } from "./components/CookieConsent";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayR — Smart Checkout para Restaurantes",
  description:
    "El cobro deja de ser el cuello de botella. Recaudo QR conectado directo a tu pasarela y POS.",
  metadataBase: new URL("https://smart-checkout-omega.vercel.app"),
  openGraph: {
    title: "PayR — Smart Checkout para Restaurantes",
    description:
      "El cobro deja de ser el cuello de botella. Recaudo QR conectado directo a tu pasarela y POS.",
    url: "https://smart-checkout-omega.vercel.app",
    siteName: "PayR",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayR — Smart Checkout para Restaurantes",
    description:
      "El cobro deja de ser el cuello de botella. Recaudo QR conectado directo a tu pasarela y POS.",
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
    <html lang="es" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#fdfaf6] text-[#1c1410]">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <CookieConsent />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
