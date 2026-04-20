"use client";

import { useEffect, useState } from "react";

import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { SocialProof } from "./components/landing/SocialProof"; /* Let's rename inside but keep import path for now or rename path? Let's just keep path for now to avoid breaking imports elsewhere if any */
import { ProductShowcase } from "./components/landing/ProductShowcase";
import { VideoDemo } from "./components/landing/VideoDemo";
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
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero />
        <SocialProof />
        <ProductShowcase />
        <VideoDemo />
        <Features />
        <Journey />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
