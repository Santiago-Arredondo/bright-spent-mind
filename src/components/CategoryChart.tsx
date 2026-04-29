import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEmptyMessage } from "@/hooks/useEmptyMessage";
import { formatCOP } from "@/lib/money";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

export const CategoryChart = ({ expenses }: Props) => {
  const { t } = useLanguage();
  const emptyMsg = useEmptyMessage("breakdown");

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    }
    const rows = CATEGORIES.map((c) => ({ ...c, value: totals[c.id] || 0 })).filter(
      (c) => c.value > 0,
    );
    const max = Math.max(1, ...rows.map((r) => r.value));
    return rows.sort((a, b) => b.value - a.value).map((r) => ({ ...r, pct: (r.value / max) * 100 }));
  }, [expenses]);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-3xl shadow-card border border-border p-6">
        <h3 className="font-display text-xl mb-2">{t("spending_by_category")}</h3>
        <p className="text-sm text-muted-foreground">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border p-6">
      <h3 className="font-display text-xl mb-5">{t("spending_by_category")}</h3>
      <ul className="space-y-3">
        {data.map((c) => (
          <li key={c.id}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-2">
                <span>{c.emoji}</span>
                <span>{t(c.labelKey)}</span>
              </span>
              <span className="tabular-nums font-medium">{formatCOP(c.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${c.pct}%`, backgroundColor: `hsl(${c.color})` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
