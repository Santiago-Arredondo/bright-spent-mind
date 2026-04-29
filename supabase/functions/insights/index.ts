import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are a witty, honest friend who happens to be good with money — not a corporate finance app.
Reply in 2-3 short sentences in English. Max ~50 words.
Tone: warm, slightly humorous, gently teasing when warranted, never preachy or judgmental. Think clever friend, not lecturing parent.
Be specific: reference an actual category, amount, or pattern from their data. No generic advice like "track your spending" or "create a budget."
Mention one concrete observation and, if useful, one small suggestion or playful nudge.
Plain prose only. No bullet lists. No markdown. No emojis unless one really lands. Don't start with "It looks like" or "I notice."`,
  es: `Eres un amigo ingenioso y honesto que resulta ser bueno con el dinero — no una app financiera corporativa.
Responde en 2-3 oraciones cortas en español. Máximo ~50 palabras.
Tono: cálido, ligeramente humorístico, con bromas suaves cuando corresponda, nunca moralista ni con juicios. Piensa amigo astuto, no padre regañón.
Sé específico: menciona una categoría, monto o patrón real de sus datos. Nada de consejos genéricos como "lleva un control" o "haz un presupuesto."
Menciona una observación concreta y, si es útil, una pequeña sugerencia o empujón juguetón.
Solo prosa simple. Sin viñetas. Sin markdown. Sin emojis a menos que alguno encaje perfecto. No empieces con "Parece que" ni "Noto que."`,
};

const USER_PROMPTS: Record<string, (total: string, count: number, summary: string) => string> = {
  en: (total, count, summary) =>
    `Here's their recent spending — total $${total} across ${count} entries:\n\n${summary}\n\nGive me one short, human insight. Be specific about what you see.`,
  es: (total, count, summary) =>
    `Estos son sus gastos recientes — total $${total} en ${count} registros:\n\n${summary}\n\nDame un análisis breve y humano. Sé específico sobre lo que ves.`,
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
        temperature: 0.9,
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
