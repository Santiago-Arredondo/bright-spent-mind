import { useMemo } from "react";
import { Droplets, Flame } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEmptyMessage } from "@/hooks/useEmptyMessage";
import { getCategory } from "@/lib/categories";
import { formatCOP } from "@/lib/money";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

const interpolate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

export const BiggestLeak = ({ expenses }: Props) => {
  const { t } = useLanguage();
  const emptyMsg = useEmptyMessage("leak");

  const { topId, topAmount, total, share } = useMemo(() => {
    const now = new Date();
    const byCat: Record<string, number> = {};
    let total = 0;
    for (const e of expenses) {
      const d = new Date(e.spent_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const amt = Number(e.amount) || 0;
        byCat[e.category] = (byCat[e.category] || 0) + amt;
        total += amt;
      }
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    return {
      topId: top?.[0] ?? null,
      topAmount: top?.[1] ?? 0,
      total,
      share: top && total > 0 ? top[1] / total : 0,
    };
  }, [expenses]);

  const cat = topId ? getCategory(topId) : null;
  const pct = `${Math.round(share * 100)}%`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border border-warning/30 bg-warning-soft/55 shadow-card transition-smooth hover:-translate-y-0.5 hover:border-warning/45"
      style={
        cat
          ? {
              background: `linear-gradient(135deg, hsl(var(--warning-soft) / 0.92), hsl(${cat.color} / 0.11), hsl(var(--card) / 0.72))`,
              borderColor: `hsl(${cat.color} / 0.35)`,
            }
          : undefined
      }
    >
      {cat && (
        <div
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl opacity-40"
          style={{ backgroundColor: `hsl(${cat.color})` }}
          aria-hidden
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-soft text-warning ring-1 ring-warning/25">
              <Droplets className="h-4 w-4" />
            </span>
            {t("leak_label")}
          </div>
          {cat && (
            <span
              className={
                share >= 0.5
                  ? "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-alert/15 text-alert"
                  : share >= 0.3
                  ? "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-warning/15 text-warning"
                  : "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-info/15 text-info"
              }
            >
              {pct}
            </span>
          )}
        </div>

        {cat ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="relative h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ring-1 ring-warning/25"
                style={{ backgroundColor: `hsl(${cat.color} / 0.20)` }}
              >
                <Flame className="absolute -right-1 -top-1 h-4 w-4 text-warning" aria-hidden />
                {cat.emoji}
              </div>
              <p className="font-display text-2xl leading-tight text-foreground">
                {interpolate(t("leak_body"), { category: t(cat.labelKey) })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {interpolate(t("leak_detail"), { amount: formatCOP(topAmount), pct })}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        )}
      </div>
    </div>
  );
};
