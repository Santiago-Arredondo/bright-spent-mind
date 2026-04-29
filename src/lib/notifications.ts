import type { Expense } from "@/components/ExpenseList";
import { getCategory } from "@/lib/categories";
import { translations, type Lang, type TKey } from "@/lib/i18n";
import type { Tone } from "@/lib/tone";

export type NotificationKind =
  | "no_log_today"
  | "weekly_spike"
  | "category_spike"
  | "big_outlier"
  | "streak_encourage";

export type AppNotification = {
  /** Stable per-day id so dismissals naturally reset the next day. */
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Lower = more important. */
  priority: number;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n: number) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
};

const interpolate = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

const tt = (key: TKey, lang: Lang): string => translations[key]?.[lang] ?? String(key);

type NotificationCopy = { title: string; body: string };
type CopyFactory = (lang: Lang, vars?: Record<string, string | number>) => NotificationCopy;

const notificationCopy: Record<NotificationKind, Record<Tone, CopyFactory>> = {
  no_log_today: {
    soft: (lang) => ({
      title: lang === "es" ? "Un recordatorio suave" : "A gentle reminder",
      body: lang === "es" ? "Si gastaste algo hoy, anótalo antes de que se pierda." : "If you spent today, jot it down before it slips away.",
    }),
    neutral: (lang) => ({ title: tt("notif_no_log_title", lang), body: tt("notif_no_log_body", lang) }),
    brutal: (lang) => ({
      title: lang === "es" ? "Hoy el registro está vacío" : "Today’s log is empty",
      body: lang === "es" ? "Tu memoria no es una app financiera. Registra el gasto." : "Your memory is not a finance app. Log the spend.",
    }),
  },
  weekly_spike: {
    soft: (lang, vars = {}) => ({
      title: lang === "es" ? "Esta semana subió un poco" : "This week is running higher",
      body: lang === "es" ? `Llevas ${vars.amount} esta semana, ${vars.pct} arriba. Vale mirarlo con calma.` : `You’re at ${vars.amount} this week, ${vars.pct} above usual. Worth a calm look.`,
    }),
    neutral: (lang, vars = {}) => ({ title: tt("notif_weekly_spike_title", lang), body: interpolate(tt("notif_weekly_spike_body", lang), vars) }),
    brutal: (lang, vars = {}) => ({
      title: lang === "es" ? "La semana se está poniendo cara" : "This week is getting pricey",
      body: lang === "es" ? `${vars.amount} esta semana, ${vars.pct} arriba. Tu billetera ya levantó la ceja.` : `${vars.amount} this week, ${vars.pct} above usual. Your wallet has raised an eyebrow.`,
    }),
  },
  category_spike: {
    soft: (lang, vars = {}) => ({
      title: lang === "es" ? "Una categoría pide atención" : "One category needs attention",
      body: lang === "es" ? `${vars.category} subió ${vars.pct}. Una revisión pequeña puede ayudar.` : `${vars.category} is up ${vars.pct}. A small check-in could help.`,
    }),
    neutral: (lang, vars = {}) => ({ title: tt("notif_cat_spike_title", lang), body: interpolate(tt("notif_cat_spike_body", lang), vars) }),
    brutal: (lang, vars = {}) => ({
      title: lang === "es" ? "Una categoría se emocionó" : "One category got excited",
      body: lang === "es" ? `${vars.category} subió ${vars.pct}. Bajémosle el volumen.` : `${vars.category} is up ${vars.pct}. Let’s turn the volume down.`,
    }),
  },
  big_outlier: {
    soft: (lang, vars = {}) => ({
      title: lang === "es" ? "Gasto grande detectado" : "Large expense spotted",
      body: lang === "es" ? `${vars.amount} en ${vars.category} pesa bastante. Revísalo sin drama.` : `${vars.amount} on ${vars.category} is a big chunk. Review it without drama.`,
    }),
    neutral: (lang, vars = {}) => ({ title: tt("notif_outlier_title", lang), body: interpolate(tt("notif_outlier_body", lang), vars) }),
    brutal: (lang, vars = {}) => ({
      title: lang === "es" ? "Ese gasto no pasó desapercibido" : "That spend did not sneak by",
      body: lang === "es" ? `${vars.amount} en ${vars.category}. No es crimen, pero sí protagonista.` : `${vars.amount} on ${vars.category}. Not a crime, but definitely the main character.`,
    }),
  },
  streak_encourage: {
    soft: (lang) => ({ title: tt("notif_streak_title", lang), body: lang === "es" ? "Buen comienzo. Otro gasto y empezamos a ver señales." : "Nice start. One more expense and patterns can start forming." }),
    neutral: (lang) => ({ title: tt("notif_streak_title", lang), body: tt("notif_streak_body", lang) }),
    brutal: (lang) => ({
      title: lang === "es" ? "Primer paso, no desfile" : "First step, not a parade",
      body: lang === "es" ? "Un gasto ayuda. Dos ya empiezan a contar una historia." : "One expense helps. Two starts telling a story.",
    }),
  },
};

const toneCopy = (kind: NotificationKind, tone: Tone, lang: Lang, vars?: Record<string, string | number>) =>
  notificationCopy[kind][tone](lang, vars);

const fmtMoney = (n: number) => `$${n.toFixed(n < 10 ? 2 : 0)}`;

const fmtPct = (frac: number) => `${Math.round(frac * 100)}%`;

const sumAmount = (xs: Expense[]) => xs.reduce((s, e) => s + Number(e.amount), 0);

/**
 * Compute notifications from the user's expenses + selected language.
 * Pure function — UI layer decides which to show / dismiss.
 */
export function computeNotifications(expenses: Expense[], lang: Lang, tone: Tone = "neutral"): AppNotification[] {
  const out: AppNotification[] = [];
  const today = todayKey();

  if (expenses.length === 0) return out;

  // Helpers ----------------------------------------------------------------
  const last7Cutoff = daysAgo(6).getTime(); // includes today
  const last14To8Cutoff = { from: daysAgo(13).getTime(), to: daysAgo(7).getTime() };
  const last28Cutoff = daysAgo(27).getTime();

  const inRange = (iso: string, fromMs: number, toMs?: number) => {
    const t = new Date(iso).getTime();
    return t >= fromMs && (toMs === undefined || t <= toMs + 86_399_000);
  };

  const week = expenses.filter((e) => inRange(e.spent_at, last7Cutoff));
  const prevWeek = expenses.filter((e) =>
    inRange(e.spent_at, last14To8Cutoff.from, last14To8Cutoff.to),
  );
  const last28 = expenses.filter((e) => inRange(e.spent_at, last28Cutoff));

  // Rule: haven't logged anything today (only if user has logged in last 5 days) ----
  const loggedToday = expenses.some((e) => e.spent_at.slice(0, 10) === today);
  const recentlyActive = expenses.some(
    (e) => new Date(e.spent_at).getTime() >= daysAgo(4).getTime(),
  );
  if (!loggedToday && recentlyActive) {
    out.push({
      id: `no_log_today:${today}`,
      kind: "no_log_today",
      title: tt("notif_no_log_title", lang),
      body: tt("notif_no_log_body", lang),
      priority: 30,
    });
  }

  // Rule: weekly spike vs 4-week daily average ----------------------------
  if (week.length >= 3 && last28.length >= 7) {
    const weekTotal = sumAmount(week);
    const monthTotal = sumAmount(last28);
    const monthDailyAvg = monthTotal / 28;
    const weekDailyAvg = weekTotal / 7;
    if (monthDailyAvg > 0 && weekDailyAvg > monthDailyAvg * 1.3) {
      const overPct = (weekDailyAvg - monthDailyAvg) / monthDailyAvg;
      out.push({
        id: `weekly_spike:${today}`,
        kind: "weekly_spike",
        title: tt("notif_weekly_spike_title", lang),
        body: interpolate(tt("notif_weekly_spike_body", lang), {
          pct: fmtPct(overPct),
          amount: fmtMoney(weekTotal),
        }),
        priority: 10,
      });
    }
  }

  // Rule: category spike vs prior week ------------------------------------
  if (week.length >= 2 && prevWeek.length >= 1) {
    const byCatNow: Record<string, number> = {};
    const byCatPrev: Record<string, number> = {};
    for (const e of week) byCatNow[e.category] = (byCatNow[e.category] || 0) + Number(e.amount);
    for (const e of prevWeek) byCatPrev[e.category] = (byCatPrev[e.category] || 0) + Number(e.amount);

    let topCat: { id: string; now: number; prev: number; delta: number } | null = null;
    for (const [id, now] of Object.entries(byCatNow)) {
      const prev = byCatPrev[id] ?? 0;
      if (prev <= 0 || now < 5) continue; // need a real baseline + meaningful amount
      const delta = (now - prev) / prev;
      if (delta < 0.4) continue;
      if (!topCat || delta > topCat.delta) topCat = { id, now, prev, delta };
    }
    if (topCat) {
      const cat = getCategory(topCat.id);
      const catLabel = `${cat.emoji} ${tt(cat.labelKey, lang)}`;
      out.push({
        id: `category_spike:${topCat.id}:${today}`,
        kind: "category_spike",
        title: tt("notif_cat_spike_title", lang),
        body: interpolate(tt("notif_cat_spike_body", lang), {
          category: catLabel,
          pct: fmtPct(topCat.delta),
        }),
        priority: 20,
      });
    }
  }

  // Rule: single big outlier in last 7 days -------------------------------
  if (week.length >= 3) {
    const weekTotal = sumAmount(week);
    const biggest = week.reduce<Expense | null>(
      (mx, e) => (mx == null || Number(e.amount) > Number(mx.amount) ? e : mx),
      null,
    );
    if (biggest && weekTotal > 0 && Number(biggest.amount) >= weekTotal * 0.4 && Number(biggest.amount) >= 20) {
      const cat = getCategory(biggest.category);
      out.push({
        id: `big_outlier:${biggest.id}`,
        kind: "big_outlier",
        title: tt("notif_outlier_title", lang),
        body: interpolate(tt("notif_outlier_body", lang), {
          amount: fmtMoney(Number(biggest.amount)),
          category: `${cat.emoji} ${tt(cat.labelKey, lang)}`,
        }),
        priority: 40,
      });
    }
  }

  // Rule: gentle nudge for brand-new users with only one expense ----------
  if (expenses.length === 1) {
    out.push({
      id: `streak_encourage:${today}`,
      kind: "streak_encourage",
      title: tt("notif_streak_title", lang),
      body: tt("notif_streak_body", lang),
      priority: 50,
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}
