"use client";

import { useEffect, useState } from "react";
import { useScroll, useTransform } from "framer-motion";

import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { Journey } from "./components/landing/Journey";
import { Pricing } from "./components/landing/Pricing";
import { CTA } from "./components/landing/CTA";
import { Footer } from "./components/landing/Footer";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero heroY={heroY} heroOpacity={heroOpacity} />
        <Journey />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
