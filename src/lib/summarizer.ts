// Builds a concise, structured financial summary suitable as AI input.
// Pure functions — no I/O. Used by client (preview/debug) and mirrored in
// the `insights` edge function.

import { parseLocalDate, toLocalDateString } from "@/lib/dateOnly";

export type SummarizerExpense = {
  amount: number | string;
  category: string;
  spent_at: string; // ISO date
  note?: string | null;
};

export type FinancialSummary = {
  period: { month: string; days_elapsed: number };
  totals: { month_total: number; entry_count: number; daily_average: number };
  top_categories: { category: string; total: number; share: number }[];
  trend: {
    direction: "increasing" | "decreasing" | "stable";
    first_half_avg: number;
    second_half_avg: number;
    change_pct: number;
  };
  patterns: string[];
};

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export const buildSummary = (
  expenses: SummarizerExpense[],
  now: Date = new Date(),
): FinancialSummary => {
  const monthIdx = now.getMonth();
  const yearIdx = now.getFullYear();

  const month = expenses.filter((e) => {
    const d = parseLocalDate(e.spent_at);
    return d.getMonth() === monthIdx && d.getFullYear() === yearIdx;
  });

  const monthTotal = month.reduce((s, e) => s + Number(e.amount), 0);
  const daysElapsed = now.getDate();
  const dailyAverage = daysElapsed > 0 ? monthTotal / daysElapsed : 0;

  // Top 3 categories
  const byCat: Record<string, number> = {};
  for (const e of month) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const topCategories = Object.entries(byCat)
    .map(([category, total]) => ({
      category,
      total: round(total),
      share: monthTotal > 0 ? round(total / monthTotal, 3) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // Trend: split current month in halves, compare daily averages
  const mid = Math.ceil(daysElapsed / 2);
  let firstSum = 0;
  let secondSum = 0;
  for (const e of month) {
    const day = parseLocalDate(e.spent_at).getDate();
    if (day <= mid) firstSum += Number(e.amount);
    else secondSum += Number(e.amount);
  }
  const firstHalfAvg = mid > 0 ? firstSum / mid : 0;
  const secondHalfDays = Math.max(1, daysElapsed - mid);
  const secondHalfAvg = secondSum / secondHalfDays;
  const changePct =
    firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
  const direction: FinancialSummary["trend"]["direction"] =
    Math.abs(changePct) < 0.1 ? "stable" : changePct > 0 ? "increasing" : "decreasing";

  // Patterns
  const patterns: string[] = [];

  // Weekend spike: avg weekend day vs avg weekday
  let weekendSum = 0;
  let weekdaySum = 0;
  let weekendCount = 0;
  let weekdayCount = 0;
  const seenDays = new Set<string>();
  for (const e of month) {
    const d = parseLocalDate(e.spent_at);
    const key = toLocalDateString(d);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekendSum += Number(e.amount);
    else weekdaySum += Number(e.amount);
    if (!seenDays.has(key)) {
      seenDays.add(key);
      if (dow === 0 || dow === 6) weekendCount++;
      else weekdayCount++;
    }
  }
  const weekendAvg = weekendCount > 0 ? weekendSum / weekendCount : 0;
  const weekdayAvg = weekdayCount > 0 ? weekdaySum / weekdayCount : 0;
  if (weekendAvg > weekdayAvg * 1.4 && weekendCount > 0) {
    patterns.push(
      `weekend_spike: weekends avg $${round(weekendAvg)} vs weekdays $${round(weekdayAvg)}`,
    );
  }

  // Single-category dominance
  if (topCategories[0] && topCategories[0].share >= 0.4) {
    patterns.push(
      `category_dominance: ${topCategories[0].category} is ${Math.round(topCategories[0].share * 100)}% of spending`,
    );
  }

  // Recent burst: last 3 days vs preceding 7-day average
  const last3 = month.filter((e) => {
    const days = (now.getTime() - new Date(e.spent_at).getTime()) / 86400000;
    return days <= 3;
  });
  const prev7 = month.filter((e) => {
    const days = (now.getTime() - new Date(e.spent_at).getTime()) / 86400000;
    return days > 3 && days <= 10;
  });
  const last3Avg = last3.reduce((s, e) => s + Number(e.amount), 0) / 3;
  const prev7Avg = prev7.reduce((s, e) => s + Number(e.amount), 0) / 7;
  if (prev7Avg > 0 && last3Avg > prev7Avg * 1.5) {
    patterns.push(`recent_burst: last 3 days avg $${round(last3Avg)} vs prior 7-day $${round(prev7Avg)}`);
  }

  // Largest single expense
  const largest = month.reduce<SummarizerExpense | null>(
    (m, e) => (m == null || Number(e.amount) > Number(m.amount) ? e : m),
    null,
  );
  if (largest && Number(largest.amount) > monthTotal * 0.2 && monthTotal > 0) {
    patterns.push(
      `outlier_expense: $${round(Number(largest.amount))} on ${largest.category} (${largest.spent_at.slice(0, 10)})`,
    );
  }

  return {
    period: {
      month: `${yearIdx}-${String(monthIdx + 1).padStart(2, "0")}`,
      days_elapsed: daysElapsed,
    },
    totals: {
      month_total: round(monthTotal),
      entry_count: month.length,
      daily_average: round(dailyAverage),
    },
    top_categories: topCategories,
    trend: {
      direction,
      first_half_avg: round(firstHalfAvg),
      second_half_avg: round(secondHalfAvg),
      change_pct: round(changePct, 3),
    },
    patterns,
  };
};

// Render a compact text block — small token footprint, easy for an LLM to read.
export const summaryToPrompt = (s: FinancialSummary): string => {
  const top = s.top_categories
    .map((c, i) => `  ${i + 1}. ${c.category} — $${c.total} (${Math.round(c.share * 100)}%)`)
    .join("\n");
  const patterns = s.patterns.length ? s.patterns.map((p) => `  - ${p}`).join("\n") : "  - none";
  return [
    `period: ${s.period.month} (day ${s.period.days_elapsed})`,
    `month_total: $${s.totals.month_total} across ${s.totals.entry_count} entries`,
    `daily_average: $${s.totals.daily_average}`,
    `trend: ${s.trend.direction} (first-half avg $${s.trend.first_half_avg} → second-half avg $${s.trend.second_half_avg}, ${s.trend.change_pct >= 0 ? "+" : ""}${Math.round(s.trend.change_pct * 100)}%)`,
    `top_categories:\n${top || "  (none)"}`,
    `patterns:\n${patterns}`,
  ].join("\n");
};
