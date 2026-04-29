import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Summarizer (mirrors src/lib/summarizer.ts) ----------
type Exp = { amount: number | string; category: string; spent_at: string; note?: string | null };
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function buildSummary(expenses: Exp[], now = new Date()) {
  const m = now.getMonth();
  const y = now.getFullYear();
  const month = expenses.filter((e) => {
    const d = new Date(e.spent_at);
    return d.getMonth() === m && d.getFullYear() === y;
  });
  const monthTotal = month.reduce((s, e) => s + Number(e.amount), 0);
  const days = now.getDate();
  const dailyAvg = days ? monthTotal / days : 0;

  const byCat: Record<string, number> = {};
  for (const e of month) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const topCategories = Object.entries(byCat)
    .map(([c, t]) => ({ category: c, total: round(t), share: monthTotal ? round(t / monthTotal, 3) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const mid = Math.ceil(days / 2);
  let firstSum = 0;
  let secondSum = 0;
  for (const e of month) {
    const d = new Date(e.spent_at).getDate();
    if (d <= mid) firstSum += Number(e.amount);
    else secondSum += Number(e.amount);
  }
  const firstAvg = mid ? firstSum / mid : 0;
  const secondDays = Math.max(1, days - mid);
  const secondAvg = secondSum / secondDays;
  const changePct = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  const direction = Math.abs(changePct) < 0.1 ? "stable" : changePct > 0 ? "increasing" : "decreasing";

  // Patterns
  const patterns: string[] = [];
  let weekendSum = 0,
    weekdaySum = 0,
    weekendDays = 0,
    weekdayDays = 0;
  const seen = new Set<string>();
  for (const e of month) {
    const d = new Date(e.spent_at);
    const key = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekendSum += Number(e.amount);
    else weekdaySum += Number(e.amount);
    if (!seen.has(key)) {
      seen.add(key);
      if (dow === 0 || dow === 6) weekendDays++;
      else weekdayDays++;
    }
  }
  const weekendAvg = weekendDays ? weekendSum / weekendDays : 0;
  const weekdayAvg = weekdayDays ? weekdaySum / weekdayDays : 0;
  if (weekendAvg > weekdayAvg * 1.4 && weekendDays > 0) {
    patterns.push(`weekend_spike: weekends avg $${round(weekendAvg)} vs weekdays $${round(weekdayAvg)}`);
  }
  if (topCategories[0] && topCategories[0].share >= 0.4) {
    patterns.push(
      `category_dominance: ${topCategories[0].category} is ${Math.round(topCategories[0].share * 100)}% of spending`,
    );
  }
  const last3 = month.filter(
    (e) => (now.getTime() - new Date(e.spent_at).getTime()) / 86400000 <= 3,
  );
  const prev7 = month.filter((e) => {
    const dd = (now.getTime() - new Date(e.spent_at).getTime()) / 86400000;
    return dd > 3 && dd <= 10;
  });
  const last3Avg = last3.reduce((s, e) => s + Number(e.amount), 0) / 3;
  const prev7Avg = prev7.reduce((s, e) => s + Number(e.amount), 0) / 7;
  if (prev7Avg > 0 && last3Avg > prev7Avg * 1.5) {
    patterns.push(`recent_burst: last 3 days avg $${round(last3Avg)} vs prior 7-day $${round(prev7Avg)}`);
  }
  const largest = month.reduce<Exp | null>(
    (mx, e) => (mx == null || Number(e.amount) > Number(mx.amount) ? e : mx),
    null,
  );
  if (largest && monthTotal > 0 && Number(largest.amount) > monthTotal * 0.2) {
    patterns.push(
      `outlier_expense: $${round(Number(largest.amount))} on ${largest.category} (${largest.spent_at.slice(0, 10)})`,
    );
  }

  return {
    period: { month: `${y}-${String(m + 1).padStart(2, "0")}`, days_elapsed: days },
    totals: { month_total: round(monthTotal), entry_count: month.length, daily_average: round(dailyAvg) },
    top_categories: topCategories,
    trend: {
      direction,
      first_half_avg: round(firstAvg),
      second_half_avg: round(secondAvg),
      change_pct: round(changePct, 3),
    },
    patterns,
  };
}

function summaryToPrompt(s: ReturnType<typeof buildSummary>) {
  const top =
    s.top_categories.map((c, i) => `  ${i + 1}. ${c.category} — $${c.total} (${Math.round(c.share * 100)}%)`).join("\n") ||
    "  (none)";
  const patterns = s.patterns.length ? s.patterns.map((p) => `  - ${p}`).join("\n") : "  - none";
  const sign = s.trend.change_pct >= 0 ? "+" : "";
  return [
    `period: ${s.period.month} (day ${s.period.days_elapsed})`,
    `month_total: $${s.totals.month_total} across ${s.totals.entry_count} entries`,
    `daily_average: $${s.totals.daily_average}`,
    `trend: ${s.trend.direction} (first-half $${s.trend.first_half_avg} → second-half $${s.trend.second_half_avg}, ${sign}${Math.round(s.trend.change_pct * 100)}%)`,
    `top_categories:\n${top}`,
    `patterns:\n${patterns}`,
  ].join("\n");
}

// ---------- Prompts ----------
const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are a witty, honest friend who happens to be good with money — not a corporate finance app.
Reply in 2-3 short sentences in English. Max ~50 words.
Tone: warm, slightly humorous, gently teasing when warranted, never preachy or judgmental. Think clever friend, not lecturing parent.
Be specific: reference an actual category, amount, trend, or pattern from the structured summary. No generic advice like "track your spending" or "create a budget."
Mention one concrete observation and, if useful, one small suggestion or playful nudge.
Plain prose only. No bullet lists. No markdown. No emojis unless one really lands. Don't start with "It looks like" or "I notice."`,
  es: `Eres un amigo ingenioso y honesto que resulta ser bueno con el dinero — no una app financiera corporativa.
Responde en 2-3 oraciones cortas en español. Máximo ~50 palabras.
Tono: cálido, ligeramente humorístico, con bromas suaves cuando corresponda, nunca moralista ni con juicios. Piensa amigo astuto, no padre regañón.
Sé específico: menciona una categoría, monto, tendencia o patrón real del resumen estructurado. Nada de consejos genéricos como "lleva un control" o "haz un presupuesto."
Menciona una observación concreta y, si es útil, una pequeña sugerencia o empujón juguetón.
Solo prosa simple. Sin viñetas. Sin markdown. Sin emojis a menos que alguno encaje perfecto. No empieces con "Parece que" ni "Noto que."`,
};

const USER_PROMPTS: Record<string, (summary: string) => string> = {
  en: (summary) => `Structured monthly summary:\n\n${summary}\n\nGive me one short, human insight grounded in this data.`,
  es: (summary) => `Resumen mensual estructurado:\n\n${summary}\n\nDame un análisis breve y humano, anclado en estos datos.`,
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

    const summary = buildSummary(expenses);
    const prompt = summaryToPrompt(summary);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.9,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[lang] },
          { role: "user", content: USER_PROMPTS[lang](prompt) },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({
          error: lang === "es" ? "Demasiadas solicitudes, intenta en un momento." : "Too many requests, try again in a moment.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({
          error: lang === "es" ? "Créditos de IA agotados. Agrega créditos en la configuración." : "AI credits exhausted. Add credits in workspace settings.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content ?? FALLBACK[lang];

    return new Response(JSON.stringify({ insight, summary }), {
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
