import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncome } from "@/hooks/useIncome";
import { buildMonthlyGroups, type MonthlyGroup } from "@/lib/monthly";
import { formatCOP } from "@/lib/money";
import { formatMonthYear } from "@/lib/dateFormat";
import { getCategory } from "@/lib/categories";
import { getIncomeSource } from "@/lib/incomeSources";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TKey } from "@/lib/i18n";

interface MonthCardProps {
  group: MonthlyGroup;
  previous?: MonthlyGroup;
  defaultOpen?: boolean;
}

const MonthCard = ({ group, previous, defaultOpen = false }: MonthCardProps) => {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  const noActivity = group.totalIncome === 0 && group.totalExpenses === 0;
  const noIncome = group.totalIncome === 0 && group.totalExpenses > 0;
  const positive = group.balance > 0;
  const negative = group.balance < 0;

  let statusKey: TKey = "monthly_even";
  if (noIncome) statusKey = "monthly_no_income";
  else if (positive) statusKey = "monthly_positive";
  else if (negative) statusKey = "monthly_negative";

  const tone = noActivity
    ? "neutral"
    : noIncome
      ? "alert"
      : positive
        ? "success"
        : negative
          ? "alert"
          : "neutral";

  const toneStyles = {
    success: {
      border: "border-success/30",
      bg: "bg-success-soft/30",
      text: "text-success",
      ring: "ring-success/30",
      iconBg: "bg-success text-success-foreground ring-success/40",
    },
    alert: {
      border: "border-alert/30",
      bg: "bg-alert-soft/30",
      text: "text-alert",
      ring: "ring-alert/30",
      iconBg: "bg-alert text-alert-foreground ring-alert/40",
    },
    neutral: {
      border: "border-border",
      bg: "bg-card",
      text: "text-foreground",
      ring: "ring-border",
      iconBg: "bg-muted text-muted-foreground ring-border",
    },
  }[tone];

  // Comparison vs previous month
  let comparison: { key: TKey; pct: string } | null = null;
  if (!previous) {
    if (!noActivity) comparison = { key: "monthly_compare_first", pct: "" };
  } else {
    const prevSavings = previous.balance;
    const currSavings = group.balance;

    // Prefer "saved more/less" framing when both months have income
    if (previous.totalIncome > 0 && group.totalIncome > 0) {
      const savedDelta = currSavings - prevSavings;
      // If absolute change is meaningful relative to prev expenses, report savings change
      const baseline = Math.max(Math.abs(prevSavings), previous.totalExpenses, 1);
      const pct = Math.round((savedDelta / baseline) * 100);
      if (Math.abs(pct) >= 1) {
        comparison = {
          key: pct > 0 ? "monthly_compare_saved_more" : "monthly_compare_saved_less",
          pct: `${Math.abs(pct)}%`,
        };
      }
    }
    // Fallback: spending delta
    if (!comparison && previous.totalExpenses > 0) {
      const delta = (group.totalExpenses - previous.totalExpenses) / previous.totalExpenses;
      const pct = Math.round(delta * 100);
      if (Math.abs(pct) >= 1) {
        comparison = {
          key: pct > 0 ? "monthly_compare_spent_more" : "monthly_compare_spent_less",
          pct: `${Math.abs(pct)}%`,
        };
      }
    }
  }

  const balanceSign = group.balance > 0 ? "+" : group.balance < 0 ? "−" : "";

  return (
    <div className={cn("rounded-3xl border shadow-card overflow-hidden transition-smooth", toneStyles.border, toneStyles.bg)}>
      {/* Header */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn("h-10 w-10 rounded-xl flex items-center justify-center ring-1 shrink-0", toneStyles.iconBg)}>
              <Wallet className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl sm:text-2xl tabular-nums truncate">
                {formatMonthYear(group.date, lang)}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("monthly_transactions_count").replace("{count}", String(group.transactions.length))}
              </p>
            </div>
          </div>
        </div>

        {/* Totals grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="truncate">{t("balance_income")}</span>
            </p>
            <p className="font-display text-base sm:text-lg tabular-nums text-success break-all">
              {formatCOP(group.totalIncome, { decimals: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-alert" />
              <span className="truncate">{t("balance_expenses")}</span>
            </p>
            <p className="font-display text-base sm:text-lg tabular-nums text-alert break-all">
              {formatCOP(group.totalExpenses, { decimals: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1 truncate">
              {t("balance_net")}
            </p>
            <p className={cn("font-display text-base sm:text-lg tabular-nums break-all", toneStyles.text)}>
              {balanceSign}
              {formatCOP(Math.abs(group.balance), { decimals: 0 })}
            </p>
          </div>
        </div>

        {/* Status + comparison */}
        <div className="mt-4 space-y-1">
          <p className={cn("text-sm font-medium", toneStyles.text)}>{t(statusKey)}</p>
          {comparison && (
            <p className="text-xs text-muted-foreground">
              {t(comparison.key).replace("{pct}", comparison.pct)}
            </p>
          )}
        </div>

        {/* Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          className="mt-4 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          {open ? t("monthly_hide_transactions") : t("monthly_show_transactions")}
        </Button>
      </div>

      {/* Transactions */}
      {open && (
        <div className="border-t border-border/60 bg-background/40">
          {group.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">{t("monthly_no_transactions")}</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {group.transactions.map((txn) => {
                const isIncome = txn.kind === "income";
                const meta = isIncome
                  ? getIncomeSource((txn.data as { source: string }).source)
                  : getCategory((txn.data as { category: string }).category);
                const amount = Number(txn.data.amount);
                const note = isIncome
                  ? (txn.data as { description: string | null }).description
                  : (txn.data as { note: string | null }).note;
                const dateLabel = new Date(txn.date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <li key={`${txn.kind}-${txn.data.id}`} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t(meta.labelKey)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {dateLabel}
                          {note ? ` · ${note}` : ""}
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "font-display tabular-nums text-sm sm:text-base shrink-0",
                        isIncome ? "text-success" : "text-alert"
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatCOP(amount, { decimals: 0 })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const Monthly = () => {
  const { t } = useLanguage();
  const { expenses, loading: lExp } = useExpenses();
  const { income, loading: lInc } = useIncome();

  const groups = useMemo(() => buildMonthlyGroups(expenses, income), [expenses, income]);
  const loading = lExp || lInc;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <section className="pt-2 pb-6 sm:pb-8">
        <p className="text-sm text-muted-foreground mb-1">{t("nav_monthly")}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2">{t("monthly_title")}</h1>
        <p className="text-muted-foreground max-w-xl text-sm sm:text-base">{t("monthly_subtitle")}</p>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl border border-border bg-card/60 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <p className="text-muted-foreground">{t("monthly_empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g, idx) => (
            <MonthCard key={g.key} group={g} previous={groups[idx + 1]} defaultOpen={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Monthly;
