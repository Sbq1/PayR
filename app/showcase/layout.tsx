import type { Metadata } from "next";
import { Parisienne } from "next/font/google";

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-showcase",
  display: "swap",
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
      className={`${parisienne.variable} min-h-screen`}
      style={{ background: "#fef3e2" }}
    >
      {children}
    </div>
  );
}
