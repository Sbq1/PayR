"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

export default function LegalLayout({
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
    <div className="min-h-screen bg-[#fdfaf6] text-[#1c1410] antialiased">
      <Navbar scrolled={scrolled} />
      <main className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
        <article className="prose prose-neutral max-w-none [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-2 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_a]:text-[#c2410c] [&_a]:underline">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
