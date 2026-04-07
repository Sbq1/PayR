"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  target,
  duration = 2500,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateValue(target, duration);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  function animateValue(end: number, dur: number) {
    const start = performance.now();

    function update(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      // ease-out-quart: fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(eased * end);
      setDisplay(current.toLocaleString("es-CO"));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplay(end.toLocaleString("es-CO"));
      }
    }

    requestAnimationFrame(update);
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
