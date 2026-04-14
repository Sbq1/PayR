import { Suspense } from "react";
import { getOrCreateShowcaseSession } from "@/lib/services/showcase.service";
import { ShowcaseClient } from "@/components/showcase/showcase-client";

export const dynamic = "force-dynamic";

async function ShowcaseInner() {
  const session = await getOrCreateShowcaseSession();
  return <ShowcaseClient session={session} />;
}

export default function ShowcasePage() {
  return (
    <Suspense fallback={<ShowcaseSkeleton />}>
      <ShowcaseInner />
    </Suspense>
  );
}

function ShowcaseSkeleton() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#fef3e2" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="text-4xl"
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
          }}
        >
          crepes & waffles
        </div>
        <div className="w-10 h-1 rounded-full bg-[#d4a574] animate-pulse" />
      </div>
    </div>
  );
}
