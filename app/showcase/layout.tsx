import type { Metadata } from "next";
import { Parisienne, Fraunces } from "next/font/google";

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-showcase",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Crepes & Waffles — Showcase",
  description: "Pedí tu crepe o waffle. Paga en segundos desde la mesa.",
  robots: { index: false, follow: false },
};

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${parisienne.variable} ${fraunces.variable} min-h-screen antialiased selection:bg-[#c8102e]/20`}
      style={{ background: "#fef3e2" }}
    >
      {children}
    </div>
  );
}
