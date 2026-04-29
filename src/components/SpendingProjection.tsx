import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { projectMonthSpending } from "@/lib/projection";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

const interpolate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

export const SpendingProjection = ({ expenses }: Props) => {
  const { t } = useLanguage();
  const p = projectMonthSpending(expenses);

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const daysLeft = Math.max(0, p.daysInMonth - p.daysSoFar);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        <TrendingUp className="h-3.5 w-3.5" />
        {t("projection_title")}
      </div>
      {p.hasData ? (
        <>
          <p className="text-base md:text-lg leading-snug">
            {interpolate(t("projection_body"), { amount: fmt(p.projectedTotal) })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {interpolate(t("projection_detail"), {
              daily: fmt(p.dailyAvg),
              days: String(daysLeft),
            })}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("projection_empty")}</p>
      )}
    </div>
  );
};
