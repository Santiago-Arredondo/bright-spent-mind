import { supabase } from "@/integrations/supabase/client";

export type SemanticScore = Map<string, number>; // key: `${kind}:${id}` → similarity

const SIM_THRESHOLD = 0.35;

/** Calls the `embed` edge function and the match RPC. Returns a score map. */
export const semanticSearch = async (
  query: string,
  userId: string,
  matchCount = 50
): Promise<SemanticScore> => {
  const empty: SemanticScore = new Map();
  const q = query.trim();
  if (!q || q.length < 3 || !userId) return empty;

  try {
    const { data: embedRes, error: embedErr } = await supabase.functions.invoke(
      "embed",
      { body: { mode: "query", text: q } }
    );
    if (embedErr || !embedRes?.embedding) return empty;

    const { data, error } = await supabase.rpc("match_user_transactions", {
      _user_id: userId,
      _query: embedRes.embedding as unknown as string,
      _match_count: matchCount,
    });
    if (error || !data) return empty;

    const map: SemanticScore = new Map();
    for (const row of data as Array<{ kind: string; row_id: string; similarity: number }>) {
      if (row.similarity < SIM_THRESHOLD) continue;
      map.set(`${row.kind}:${row.row_id}`, row.similarity);
    }
    return map;
  } catch {
    return empty;
  }
};

/** Fire-and-forget call to backfill embeddings for the current user. */
export const syncEmbeddings = async (): Promise<void> => {
  try {
    await supabase.functions.invoke("embed", { body: { mode: "sync" } });
  } catch {
    // silent — best effort
  }
};
