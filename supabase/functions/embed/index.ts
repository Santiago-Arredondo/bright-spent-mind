// Semantic-search embedding function.
// - POST { mode: "query", text }         → returns { embedding: number[] }
// - POST { mode: "sync" }                → backfills missing embeddings for the caller
// Auth required (verify_jwt defaults to true).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODEL = "openai/text-embedding-3-small"; // 1536 dims
const BATCH = 32;
const ROW_LIMIT = 200; // per sync invocation

async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input: inputs }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`embeddings_${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.data || []).map((d: { embedding: number[] }) => d.embedding);
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return json(500, { error: "server_misconfigured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) return json(401, { error: "missing_auth" });

  // Resolve the calling user
  const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: userData, error: userErr } = await anon.auth.getUser(accessToken);
  if (userErr || !userData?.user) return json(401, { error: "invalid_auth" });
  const userId = userData.user.id;

  let body: { mode?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    if (body.mode === "query") {
      const text = (body.text || "").trim();
      if (!text) return json(400, { error: "empty_text" });
      const [embedding] = await embedTexts(apiKey, [text.slice(0, 2000)]);
      return json(200, { embedding });
    }

    if (body.mode === "sync") {
      // Pull rows missing embeddings (or with stale model) for this user.
      const [expRes, incRes, catRes] = await Promise.all([
        admin
          .from("expenses")
          .select("id, description, category")
          .eq("user_id", userId)
          .or(`embedding.is.null,embedding_model.neq.${MODEL}`)
          .limit(ROW_LIMIT),
        admin
          .from("income")
          .select("id, description, source")
          .eq("user_id", userId)
          .or(`embedding.is.null,embedding_model.neq.${MODEL}`)
          .limit(ROW_LIMIT),
        admin
          .from("categories")
          .select("id, name")
          .eq("user_id", userId)
          .or(`embedding.is.null,embedding_model.neq.${MODEL}`)
          .limit(ROW_LIMIT),
      ]);

      const expRows = expRes.data || [];
      const incRows = incRes.data || [];
      const catRows = catRes.data || [];

      // Build slug→name map for expense category context
      const catMapRes = await admin
        .from("categories")
        .select("slug, name")
        .eq("user_id", userId);
      const catName = new Map<string, string>();
      for (const r of catMapRes.data || []) catName.set(r.slug, r.name);

      const buildExpText = (r: { description: string | null; category: string }) =>
        `${(r.description || "").trim()} — ${catName.get(r.category) || r.category}`.trim();
      const buildIncText = (r: { description: string | null; source: string }) =>
        `${(r.description || "").trim()} — ${r.source}`.trim();
      const buildCatText = (r: { name: string }) => r.name;

      type Task = { table: "expenses" | "income" | "categories"; id: string; text: string };
      const tasks: Task[] = [
        ...expRows.map((r) => ({ table: "expenses" as const, id: r.id, text: buildExpText(r) })),
        ...incRows.map((r) => ({ table: "income" as const, id: r.id, text: buildIncText(r) })),
        ...catRows.map((r) => ({ table: "categories" as const, id: r.id, text: buildCatText(r) })),
      ].filter((t) => t.text.length > 0);

      let updated = 0;
      for (const group of chunk(tasks, BATCH)) {
        const vecs = await embedTexts(apiKey, group.map((g) => g.text.slice(0, 2000)));
        await Promise.all(
          group.map((g, i) =>
            admin
              .from(g.table)
              .update({ embedding: vecs[i] as unknown as string, embedding_model: MODEL })
              .eq("id", g.id)
              .eq("user_id", userId)
          )
        );
        updated += group.length;
      }
      return json(200, { updated, remaining: Math.max(0, tasks.length - updated) });
    }

    return json(400, { error: "invalid_mode" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("embeddings_429")) return json(429, { error: "rate_limited" });
    if (msg.startsWith("embeddings_402")) return json(402, { error: "credits_exhausted" });
    return json(500, { error: msg });
  }
});
