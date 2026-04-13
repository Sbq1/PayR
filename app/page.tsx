"use client";

import { useEffect, useState } from "react";

import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { SocialProof } from "./components/landing/SocialProof";
import { Stats } from "./components/landing/Stats";
import { ProductShowcase } from "./components/landing/ProductShowcase";
import { Features } from "./components/landing/Features";
import { Journey } from "./components/landing/Journey";
import { Pricing } from "./components/landing/Pricing";
import { CTA } from "./components/landing/CTA";
import { Footer } from "./components/landing/Footer";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#141b2b] antialiased">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero />
        <SocialProof />
        <Stats />
        <ProductShowcase />
        <Journey />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
