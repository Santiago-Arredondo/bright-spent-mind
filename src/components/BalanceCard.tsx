import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCOP } from "@/lib/money";
import { formatMonthYear, isSameMonth } from "@/lib/dateFormat";
import type { Expense } from "@/components/ExpenseList";
import type { Income } from "@/hooks/useIncome";
import { cn } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  income: Income[];
  now?: Date;
}

export const BalanceCard = ({ expenses, income, now }: Props) => {
  const { t, lang } = useLanguage();
  const reference = now ?? new Date();

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = income.filter((i) => isSameMonth(i.received_at, reference)).reduce((s, i) => s + Number(i.amount), 0);
    const totalExpenses = expenses.filter((e) => isSameMonth(e.spent_at, reference)).reduce((s, e) => s + Number(e.amount), 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [expenses, income, reference]);

  const noActivity = totalIncome === 0 && totalExpenses === 0;
  const positive = balance >= 0;
  const message = noActivity ? t("balance_neutral") : positive ? t("balance_saving") : t("balance_overspending");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border shadow-card p-5 sm:p-6 transition-smooth",
        noActivity
          ? "border-border bg-card"
          : positive
            ? "border-success/30 bg-success-soft/40"
            : "border-alert/30 bg-alert-soft/40"
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center ring-1",
              noActivity ? "bg-muted text-muted-foreground ring-border" :
              positive ? "bg-success text-success-foreground ring-success/40" :
              "bg-alert text-alert-foreground ring-alert/40"
            )}
          >
            <Wallet className="h-4 w-4" />
          </span>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("balance_title")}</p>
        </div>
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground/80 tabular-nums">
          {formatMonthYear(reference, lang)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-success" />
            <span className="truncate">{t("balance_income")}</span>
          </p>
          <p className="font-display text-base sm:text-xl tabular-nums text-success break-all">
            {formatCOP(totalIncome, { decimals: 0 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3 text-alert" />
            <span className="truncate">{t("balance_expenses")}</span>
          </p>
          <p className="font-display text-base sm:text-xl tabular-nums text-alert break-all">
            {formatCOP(totalExpenses, { decimals: 0 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 truncate">
            {t("balance_net")}
          </p>
          <p
            className={cn(
              "font-display text-base sm:text-xl tabular-nums break-all",
              noActivity ? "text-foreground" : positive ? "text-success" : "text-alert"
            )}
          >
            {balance >= 0 ? "+" : "−"}
            {formatCOP(Math.abs(balance), { decimals: 0 }).replace("COP $", "COP $")}
          </p>
        </div>
      </div>

      <p
        className={cn(
          "mt-4 text-sm font-medium",
          noActivity ? "text-muted-foreground" : positive ? "text-success" : "text-alert"
        )}
      >
        {message}
      </p>
    </div>
  );
};
