import { track } from "@vercel/analytics";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

const REF_MAX_LEN = 64;

export function extractRef(search: string): string | null {
  const ref = new URLSearchParams(search).get("ref");
  if (!ref) return null;
  if (ref.length > REF_MAX_LEN) return null;
  return ref;
}

export async function trackRefVisit(search: string): Promise<void> {
  const ref = extractRef(search);
  if (!ref) return;

  track("ref_visit", { ref });

  if (!isSupabaseConfigured()) return;

  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : null;

  try {
    const sb = getSupabase();
    await sb.from("ref_visits").insert({ ref, user_agent: userAgent });
  } catch {
    // Fire-and-forget — falha de tracking nunca quebra a experiência.
  }
}
