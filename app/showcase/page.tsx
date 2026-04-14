import { getOrCreateShowcaseSession } from "@/lib/services/showcase.service";
import { ShowcaseClient } from "@/components/showcase/showcase-client";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  let session;
  try {
    session = await getOrCreateShowcaseSession();
  } catch (err) {
    const e = err as Error;
    console.error("[/showcase] server error:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
    });
    throw err;
  }
  return <ShowcaseClient session={session} />;
}
