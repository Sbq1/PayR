"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on devices with hover (desktop)
    const hasHover = window.matchMedia("(hover: hover)").matches;
    if (!hasHover) return;

    const glow = glowRef.current;
    if (!glow) return;

    let rafId: number;

    function onMouseMove(e: MouseEvent) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (glow) {
          glow.style.left = `${e.clientX}px`;
          glow.style.top = `${e.clientY}px`;
          glow.style.opacity = "1";
        }
      });
    }

    function onMouseLeave() {
      if (glow) glow.style.opacity = "0";
    }

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[9999] w-[300px] h-[300px] rounded-full opacity-0 transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)",
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    />
  );
}
