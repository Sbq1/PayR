"use client";

import { useEffect, useRef } from "react";

type RevealDirection = "up" | "left" | "right" | "scale";

/**
 * Hook that triggers CSS reveal animations when an element scrolls into view.
 * Uses IntersectionObserver — once revealed, the element stays visible.
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>("up");
 *   <div ref={ref} className="reveal-up">...</div>
 *
 * CSS classes required in globals.css:
 *   .reveal-up / .reveal-left / .reveal-right / .reveal-scale
 *   + .revealed state
 */
export function useScrollReveal<T extends HTMLElement>(
  _direction: RevealDirection = "up",
  delay: number = 0
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set delay as CSS variable for staggering
    if (delay > 0) {
      el.style.transitionDelay = `${delay}s`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [delay]);

  return ref;
}

/**
 * Batch reveal: observes a container and reveals all children with
 * `.reveal-up` (or other reveal classes) with staggered delays.
 *
 * Usage:
 *   const containerRef = useStaggerReveal<HTMLDivElement>(0.08);
 *   <div ref={containerRef}>
 *     <div className="reveal-up">Card 1</div>
 *     <div className="reveal-up">Card 2</div>
 *   </div>
 */
export function useStaggerReveal<T extends HTMLElement>(
  staggerDelay: number = 0.08
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = container.querySelectorAll(
              ".reveal-up, .reveal-left, .reveal-right, .reveal-scale"
            );
            children.forEach((child, index) => {
              const el = child as HTMLElement;
              el.style.transitionDelay = `${index * staggerDelay}s`;
              // Small timeout to ensure the delay is applied before adding class
              requestAnimationFrame(() => {
                el.classList.add("revealed");
              });
            });
            observer.unobserve(container);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [staggerDelay]);

  return ref;
}
