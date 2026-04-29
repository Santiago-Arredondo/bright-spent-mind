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
type Tone = "soft" | "neutral" | "brutal";

const TONE_GUIDE: Record<string, Record<Tone, string>> = {
  en: {
    soft: `TONE: Soft & supportive. Warm, encouraging, kind. Celebrate small wins, frame nudges as gentle suggestions ("you might try…", "no pressure, but…"). Never shame or scold. Think caring friend cheering you on.`,
    neutral: `TONE: Neutral & informative. Calm, clear, factual — like a thoughtful analyst. State the pattern, give one concrete suggestion. No jokes, no judgment, no fluff. Plain and useful.`,
    brutal: `TONE: Brutal & direct, with light sarcasm. Call the spending out plainly, with a dry one-liner if it fits. Be honest, even a bit cheeky — but NEVER insulting, cruel, body-shaming, or moralistic. The user opted in for tough love, so deliver it like a witty older sibling, not a bully. End with a sharp, concrete nudge.`,
  },
  es: {
    soft: `TONO: Suave y alentador. Cálido, amable, motivador. Celebra los pequeños logros y plantea los empujones como sugerencias gentiles ("podrías probar…", "sin presión, pero…"). Nunca regañes ni avergüences. Como un amigo cariñoso que te anima.`,
    neutral: `TONO: Neutral e informativo. Calmado, claro, factual — como un analista atento. Describe el patrón y da una sugerencia concreta. Sin bromas, sin juicios, sin relleno. Simple y útil.`,
    brutal: `TONO: Brutal y directo, con sarcasmo ligero. Señala el gasto sin rodeos, con una frase seca si encaja. Sé honesto e incluso un poco pícaro — pero NUNCA insultante, cruel, con burlas físicas ni moralista. El usuario eligió "amor duro", así que entrégalo como un hermano mayor ingenioso, no como un abusivo. Cierra con un empujón concreto y filoso.`,
  },
};

const buildSystemPrompt = (lang: string, tone: Tone): string => {
  const langRule =
    lang === "es"
      ? `IDIOMA: Responde ÚNICAMENTE en español. Cada palabra debe estar en español. NO incluyas palabras, frases ni traducciones en inglés. Si los datos contienen notas o etiquetas en inglés, tradúcelas mentalmente y responde en español. Nunca mezcles idiomas.`
      : `LANGUAGE: Respond ONLY in English. Every word must be English. Do NOT include any Spanish words, phrases, or translations. If the data contains Spanish notes or category labels, mentally translate them and reply in English. Never mix languages.`;

  const role =
    lang === "es"
      ? `Eres un asistente personal de finanzas. Respondes en 2-3 oraciones cortas, máximo ~50 palabras.`
      : `You are a personal money assistant. Reply in 2-3 short sentences, max ~50 words.`;

  const specificity =
    lang === "es"
      ? `Sé específico y ACCIONABLE: menciona una categoría, monto, tendencia o patrón real del resumen y termina con un empujón concreto y realizable (nada de "lleva un control" o "haz un presupuesto").
Si te dan "previous_insights", escribe algo claramente DISTINTO — otro ángulo, otra categoría o patrón, otra forma de empezar. No repitas la misma observación ni el mismo arranque.
Solo prosa simple. Sin viñetas. Sin markdown. Sin emojis a menos que alguno encaje perfecto.`
      : `Be specific and ACTIONABLE: reference an actual category, amount, trend, or pattern from the structured summary, and end with one concrete, doable nudge (not generic advice like "track your spending" or "make a budget").
If "previous_insights" is provided, write something clearly DIFFERENT — different angle, different category or pattern, different phrasing. Do not repeat the same opening or observation.
Plain prose only. No bullet lists. No markdown. No emojis unless one really lands.`;

  const safety =
    lang === "es"
      ? `LÍMITES INNEGOCIABLES: nunca seas ofensivo, hiriente, discriminatorio ni hagas comentarios sobre el cuerpo, salud mental, relaciones o moral del usuario. Mantente útil siempre. Si el tono pedido es "brutal", el filo es solo sobre los hábitos de gasto.`
      : `NON-NEGOTIABLE LIMITS: never be offensive, hurtful, discriminatory, or make comments about the user's body, mental health, relationships, or morality. Stay genuinely helpful. If the requested tone is "brutal", the edge is strictly about spending habits.`;

  return [langRule, "", role, TONE_GUIDE[lang][tone], specificity, safety].join("\n\n");
};

const USER_PROMPTS: Record<string, (summary: string, previous: string[]) => string> = {
  en: (summary, previous) =>
    `Structured monthly summary:\n\n${summary}\n\n${
      previous.length
        ? `previous_insights (do NOT repeat these — pick a different angle):\n${previous.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`
        : ""
    }Give me one short, human, actionable insight grounded in this data.`,
  es: (summary, previous) =>
    `Resumen mensual estructurado:\n\n${summary}\n\n${
      previous.length
        ? `previous_insights (NO los repitas — toma otro ángulo):\n${previous.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`
        : ""
    }Dame un análisis breve, humano y accionable anclado en estos datos.`,
};

const EMPTY_INSIGHT: Record<string, string> = {
  en: "Add a few expenses and I'll share patterns I notice. Even three or four is enough to start.",
  es: "Agrega algunos gastos y compartiré los patrones que note. Con tres o cuatro basta para empezar.",
};

const FALLBACK: Record<string, string> = {
  en: "Keep tracking — patterns will emerge soon.",
  es: "Sigue registrando — pronto aparecerán los patrones.",
};

// ---------- In-memory cache + cooldown (per-warm-instance, best-effort) ----------
type CacheEntry = { ts: number; insight: string; recent: string[]; fingerprint: string };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // serve cached insight within 1 min for identical data

function fingerprintSummary(s: ReturnType<typeof buildSummary>, lang: string, tone: Tone) {
  return [
    lang,
    tone,
    s.period.month,
    s.totals.month_total,
    s.totals.entry_count,
    s.trend.direction,
    s.top_categories.map((c) => `${c.category}:${c.total}`).join("|"),
    s.patterns.join("|"),
  ].join("::");
}

const isTone = (v: unknown): v is Tone => v === "soft" || v === "neutral" || v === "brutal";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const expenses = Array.isArray(body?.expenses) ? body.expenses : [];
    const lang = body?.lang === "en" ? "en" : "es";
    const tone: Tone = isTone(body?.tone) ? body.tone : "neutral";
    // Optional client-supplied list of recent insights to avoid repeating
    const clientPrev: string[] = Array.isArray(body?.previous_insights)
      ? body.previous_insights.filter((s: unknown) => typeof s === "string").slice(0, 5)
      : [];
    // Stable per-caller key (auth header preferred, IP fallback) so cache + history don't bleed across users
    const authHeader = req.headers.get("authorization") ?? "";
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const callerKey = `${lang}:${tone}:${authHeader || ip}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (expenses.length === 0) {
      return new Response(JSON.stringify({ insight: EMPTY_INSIGHT[lang] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = buildSummary(expenses);
    const fingerprint = fingerprintSummary(summary, lang, tone);
    const cached = CACHE.get(callerKey);

    // Cost guard #1: identical-data calls within TTL → return cached insight, skip LLM
    if (cached && cached.fingerprint === fingerprint && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ insight: cached.insight, summary, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build "previous_insights" list — server-tracked recent + anything the client passes
    const recent = cached?.recent ?? [];
    const previous = Array.from(new Set([...clientPrev, ...recent])).slice(0, 5);

    const prompt = summaryToPrompt(summary);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // OpenAI via Lovable AI Gateway — no separate OpenAI key needed
        model: "openai/gpt-5-mini",
        // Higher temp + presence/frequency penalties = less repetition across calls
        temperature: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.4,
        max_completion_tokens: 120,
        messages: [
          { role: "system", content: buildSystemPrompt(lang, tone) },
          { role: "user", content: USER_PROMPTS[lang](prompt, previous) },
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
    const insight: string = (data.choices?.[0]?.message?.content ?? FALLBACK[lang]).trim();

    // Update cache: keep last 5 insights for anti-repetition
    const nextRecent = [insight, ...recent.filter((r) => r !== insight)].slice(0, 5);
    CACHE.set(callerKey, { ts: Date.now(), insight, recent: nextRecent, fingerprint });

    return new Response(JSON.stringify({ insight, summary, cached: false }), {
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
