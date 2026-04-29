import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { expenses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (!expenses || expenses.length === 0) {
      return new Response(
        JSON.stringify({ insight: "Add a few expenses and I'll share patterns I notice. Even three or four is enough to start." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const summary = expenses
      .slice(0, 100)
      .map((e: any) => `${e.spent_at?.slice(0, 10)} · ${e.category} · $${e.amount}${e.note ? ` (${e.note})` : ""}`)
      .join("\n");

    const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a friendly, slightly opinionated personal finance coach. Reply in 2-3 short sentences. Be warm, specific, and concrete. Mention one observation and one gentle suggestion. No bullet lists. No markdown. Use plain prose.",
          },
          {
            role: "user",
            content: `Total spent: $${total.toFixed(2)} across ${expenses.length} expenses.\n\nRecent expenses:\n${summary}\n\nGive me a quick insight.`,
          },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests, try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content ?? "Keep tracking — patterns will emerge soon.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
