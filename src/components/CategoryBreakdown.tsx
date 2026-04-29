import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

export const CategoryBreakdown = ({ expenses }: Props) => {
  const { t } = useLanguage();
  const { totals, total } = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
      total += Number(e.amount);
    }
    return { totals, total };
  }, [expenses]);

  const sorted = CATEGORIES.map((c) => ({ ...c, value: totals[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <div className="bg-card rounded-3xl shadow-card border border-border p-6">
        <h3 className="font-display text-xl mb-2">{t("where_it_goes")}</h3>
        <p className="text-sm text-muted-foreground">{t("breakdown_empty")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border p-6">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display text-xl">{t("where_it_goes")}</h3>
        <p className="font-display text-2xl tabular-nums">${total.toFixed(2)}</p>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-secondary">
        {sorted.map((c) => (
          <div
            key={c.id}
            style={{ width: `${(c.value / total) * 100}%`, backgroundColor: `hsl(${c.color})` }}
            title={`${t(c.labelKey)}: $${c.value.toFixed(2)}`}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {sorted.map((c) => {
          const pct = (c.value / total) * 100;
          return (
            <li key={c.id} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: `hsl(${c.color})` }}
              />
              <span className="flex-1 text-sm">
                {c.emoji} {t(c.labelKey)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {pct.toFixed(0)}%
              </span>
              <span className="text-sm font-medium tabular-nums w-20 text-right">
                ${c.value.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
