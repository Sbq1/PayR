"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#141b2b] antialiased">
      <Navbar scrolled={scrolled} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
