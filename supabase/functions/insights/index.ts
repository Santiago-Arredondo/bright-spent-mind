import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  en: "You are a friendly, slightly opinionated personal finance coach. Reply in 2-3 short sentences in English. Be warm, specific, and concrete. Mention one observation and one gentle suggestion. No bullet lists. No markdown. Use plain prose.",
  es: "Eres un coach financiero amigable y un poco opinionado. Responde en 2-3 oraciones cortas en español. Sé cálido, específico y concreto. Menciona una observación y una sugerencia suave. Sin listas con viñetas. Sin markdown. Usa prosa simple.",
};

const USER_PROMPTS: Record<string, (total: string, count: number, summary: string) => string> = {
  en: (total, count, summary) =>
    `Total spent: $${total} across ${count} expenses.\n\nRecent expenses:\n${summary}\n\nGive me a quick insight.`,
  es: (total, count, summary) =>
    `Total gastado: $${total} en ${count} gastos.\n\nGastos recientes:\n${summary}\n\nDame un análisis breve.`,
};

const EMPTY_INSIGHT: Record<string, string> = {
  en: "Add a few expenses and I'll share patterns I notice. Even three or four is enough to start.",
  es: "Agrega algunos gastos y compartiré los patrones que note. Con tres o cuatro basta para empezar.",
};

const FALLBACK: Record<string, string> = {
  en: "Keep tracking — patterns will emerge soon.",
  es: "Sigue registrando — pronto aparecerán los patrones.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { expenses, lang: rawLang } = await req.json();
    const lang = rawLang === "en" ? "en" : "es";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({ insight: EMPTY_INSIGHT[lang] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          { role: "system", content: SYSTEM_PROMPTS[lang] },
          { role: "user", content: USER_PROMPTS[lang](total.toFixed(2), expenses.length, summary) },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: lang === "es" ? "Demasiadas solicitudes, intenta en un momento." : "Too many requests, try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: lang === "es" ? "Créditos de IA agotados. Agrega créditos en la configuración." : "AI credits exhausted. Add credits in workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content ?? FALLBACK[lang];

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
