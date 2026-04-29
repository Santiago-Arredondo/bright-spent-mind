import { useMemo } from "react";
import { Flame } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategory } from "@/lib/categories";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

const interpolate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

export const BiggestLeak = ({ expenses }: Props) => {
  const { t } = useLanguage();

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
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const pct = `${Math.round(share * 100)}%`;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 border border-border shadow-card"
      style={
        cat
          ? {
              background: `linear-gradient(135deg, hsl(${cat.color} / 0.18), hsl(${cat.color} / 0.04))`,
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
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
          <Flame
            className="h-3.5 w-3.5"
            style={cat ? { color: `hsl(${cat.color})` } : undefined}
          />
          {t("leak_label")}
        </div>

        {cat ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `hsl(${cat.color} / 0.25)` }}
              >
                {cat.emoji}
              </div>
              <p className="font-display text-xl leading-snug">
                {interpolate(t("leak_body"), { category: t(cat.labelKey) })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {interpolate(t("leak_detail"), { amount: fmt(topAmount), pct })}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("leak_empty")}</p>
        )}
      </div>
    </div>
  );
};
