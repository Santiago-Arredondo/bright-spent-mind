import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { projectMonthSpending } from "@/lib/projection";
import { cn } from "@/lib/utils";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
  /** Optional baseline (e.g. user budget). Falls back to last-projection heuristic. */
  monthlyBaseline?: number;
}

const interpolate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

type Pace = "calm" | "watch" | "over";

const PACE_STYLES: Record<Pace, { ring: string; bg: string; chip: string; icon: string; Icon: typeof TrendingUp }> = {
  calm:  { ring: "border-success/30",  bg: "bg-success-soft/40",  chip: "bg-success/10 text-success",  icon: "text-success",  Icon: TrendingDown },
  watch: { ring: "border-warning/40",  bg: "bg-warning-soft/50",  chip: "bg-warning/15 text-warning",  icon: "text-warning",  Icon: Minus },
  over:  { ring: "border-alert/40",    bg: "bg-alert-soft/50",    chip: "bg-alert/15 text-alert",      icon: "text-alert",    Icon: TrendingUp },
};

export const SpendingProjection = ({ expenses, monthlyBaseline }: Props) => {
  const { t } = useLanguage();
  const p = projectMonthSpending(expenses);

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const daysLeft = Math.max(0, p.daysInMonth - p.daysSoFar);

  // Decide pace: compare current daily avg vs the stable trailing avg.
  // No external baseline → use a soft self-compare against (monthTotal so far / daysSoFar)
  // smoothed by entries; flag "watch" when projection > 1.15× of typical, "over" when > 1.4×.
  let pace: Pace = "watch";
  if (p.hasData) {
    const baseline =
      monthlyBaseline && monthlyBaseline > 0
        ? monthlyBaseline
        : p.dailyAvg * p.daysInMonth * 0.85; // implicit "comfortable" target
    const ratio = baseline > 0 ? p.projectedTotal / baseline : 1;
    if (ratio >= 1.4) pace = "over";
    else if (ratio >= 1.15) pace = "watch";
    else pace = "calm";
  }
  const s = PACE_STYLES[pace];
  const PaceIcon = s.Icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-card transition-smooth",
        p.hasData ? s.bg : "bg-card",
        p.hasData ? s.ring : "border-border",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <TrendingUp className={cn("h-3.5 w-3.5", p.hasData && s.icon)} />
          {t("projection_title")}
        </div>
        {p.hasData && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold",
              s.chip,
            )}
          >
            <PaceIcon className="h-3 w-3" />
            {t(pace === "over" ? "pace_over" : pace === "watch" ? "pace_watch" : "pace_calm")}
          </span>
        )}
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
        <p className="text-sm text-muted-foreground">{emptyMsg}</p>
      )}
    </div>
  );
};
