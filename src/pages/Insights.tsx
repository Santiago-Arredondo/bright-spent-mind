import { useMemo } from "react";
import type { Expense } from "@/components/ExpenseList";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AIInsight } from "@/components/AIInsight";
import { getCategory } from "@/lib/categories";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEmptyMessage } from "@/hooks/useEmptyMessage";
import { formatCOP } from "@/lib/money";
import { useNow } from "@/hooks/useNow";
import { formatLongDate, formatMonthYear } from "@/lib/dateFormat";
import { parseLocalDate } from "@/lib/dateOnly";

interface Props {
  expenses: Expense[];
}

const Insights = ({ expenses }: Props) => {
  const { t, lang } = useLanguage();
  const trendEmpty = useEmptyMessage("trend");
  const now = useNow();
  const locale = lang === "es" ? "es-ES" : "en-US";

  const { byMonth, topCat, biggest, dailyAvg, daysActive } = useMemo(() => {
    const byMonth: Record<string, number> = {};
    const byCat: Record<string, number> = {};
    const daysSet = new Set<string>();
    let total = 0;
    let biggest: Expense | null = null;
    for (const e of expenses) {
      const d = parseLocalDate(e.spent_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[k] = (byMonth[k] || 0) + Number(e.amount);
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
      daysSet.add(d.toDateString());
      total += Number(e.amount);
      if (!biggest || Number(e.amount) > Number(biggest.amount)) biggest = e;
    }
    const topCatId = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCat = topCatId ? { ...getCategory(topCatId), amount: byCat[topCatId] } : null;
    const daysActive = daysSet.size || 1;
    return { byMonth, topCat, biggest, dailyAvg: total / daysActive, daysActive };
  }, [expenses]);

  const monthEntries = Object.entries(byMonth)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 6)
    .reverse();
  const maxMonth = Math.max(1, ...monthEntries.map(([, v]) => v));

  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <section className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">
          {t("insights")} · <span className="tabular-nums">{formatMonthYear(now, lang)}</span>
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">{t("insights_title")}</h1>
        <p className="text-muted-foreground max-w-xl">{t("insights_subtitle")}</p>
        <p className="text-xs text-muted-foreground/80 mt-2">
          {t("today_is")} {formatLongDate(now, lang)}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <AIInsight expenses={expenses} />
        <div className="bg-card rounded-3xl border border-border shadow-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("at_a_glance")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("daily_average")}</p>
              <p className="font-display text-2xl tabular-nums">{formatCOP(dailyAvg)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("active_days")}</p>
              <p className="font-display text-2xl tabular-nums">{daysActive}</p>
            </div>
            {topCat && (
              <div>
                <p className="text-xs text-muted-foreground">{t("top_category")}</p>
                <p className="font-display text-2xl">
                  {topCat.emoji} {t(topCat.labelKey)}
                </p>
              </div>
            )}
            {biggest && (
              <div>
                <p className="text-xs text-muted-foreground">{t("largest_expense")}</p>
                <p className="font-display text-2xl tabular-nums">
                  {formatCOP(biggest.amount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 bg-card rounded-3xl border border-border shadow-card p-6">
          <h3 className="font-display text-xl mb-5">{t("monthly_trend")}</h3>
          {monthEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{trendEmpty}</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {monthEntries.map(([k, v]) => {
                const [y, m] = k.split("-");
                const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(locale, {
                  month: "short",
                });
                return (
                  <div key={k} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <span className="text-xs text-muted-foreground tabular-nums mb-1">
                        {formatCOP(v, { decimals: 0 })}
                      </span>
                      <div
                        className="w-full bg-gradient-primary rounded-t-lg transition-smooth"
                        style={{ height: `${(v / maxMonth) * 80}%`, minHeight: "4px" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <CategoryBreakdown expenses={expenses} />
        </div>
      </div>
    </div>
  );
};

export default Insights;
