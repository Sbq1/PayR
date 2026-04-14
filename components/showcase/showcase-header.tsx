"use client";

export function ShowcaseHeader() {
  return (
    <header className="relative w-full pt-5 pb-4 flex flex-col items-center">
      <div className="relative flex flex-col items-center gap-0.5">
        <div
          className="text-[42px] leading-none tracking-tight"
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
            textShadow: "0 1px 0 rgba(0,0,0,0.03)",
          }}
        >
          crepes<span className="mx-1 font-normal">&</span>waffles
        </div>
        <span
          className="text-[9px] tracking-[0.28em] uppercase font-medium"
          style={{ color: "#2d1810", opacity: 0.55 }}
        >
          · showcase ·
        </span>
      </div>
    </header>
  );
}
