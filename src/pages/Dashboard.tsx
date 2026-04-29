import { type ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Minus,
  ReceiptText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CategoryChart } from "@/components/CategoryChart";
import { AIInsight } from "@/components/AIInsight";
import { SpendingProjection } from "@/components/SpendingProjection";
import { BiggestLeak } from "@/components/BiggestLeak";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategory } from "@/lib/categories";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
}

type MetricTone = "success" | "warning" | "alert";
type MetricDirection = "up" | "down" | "flat";

const metricToneStyles: Record<MetricTone, { card: string; badge: string; trend: string; bar: string }> = {
  success: {
    card: "border-success/20 bg-card/70 hover:border-success/35",
    badge: "bg-success-soft text-success ring-success/20",
    trend: "bg-success-soft text-success ring-success/25",
    bar: "bg-success",
  },
  warning: {
    card: "border-warning/25 bg-card/70 hover:border-warning/40",
    badge: "bg-warning-soft text-warning ring-warning/25",
    trend: "bg-warning-soft text-warning ring-warning/30",
    bar: "bg-warning",
  },
  alert: {
    card: "border-alert/25 bg-card/70 hover:border-alert/45",
    badge: "bg-alert-soft text-alert ring-alert/25",
    trend: "bg-alert-soft text-alert ring-alert/30",
    bar: "bg-alert",
  },
};

const directionIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

const getDirection = (delta: number, threshold = 0.08): MetricDirection => {
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "flat";
};

const trendText = (delta: number, hasBaseline: boolean) => {
  if (!hasBaseline) return "—";
  return `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%`;
};

const MetricCard = ({
  label,
  value,
  icon,
  tone,
  direction,
  trend,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: MetricTone;
  direction: MetricDirection;
  trend: string;
}) => {
  const styles = metricToneStyles[tone];
  const TrendIcon = directionIcon[direction];

  return (
    <div className={`group relative overflow-hidden rounded-xl border px-4 py-3 shadow-card transition-smooth hover:-translate-y-0.5 ${styles.card}`}>
      <div className={`absolute inset-x-0 top-0 h-0.5 opacity-80 ${styles.bar}`} aria-hidden />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/80">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${styles.badge}`}>
            {icon}
          </span>
          <span className="truncate pt-0.5">{label}</span>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tabular-nums ring-1 ${styles.trend}`}>
          <TrendIcon className="h-3 w-3" />
          {trend}
        </span>
      </div>
      <div className="font-display text-xl tabular-nums text-foreground/90">{value}</div>
    </div>
  );
};

const Dashboard = ({ expenses, loading, onDelete }: Props) => {
  const { t } = useLanguage();

  const { monthExpenses, monthTotal, dailyAvg, topCategoryId, count } = useMemo(() => {
    const now = new Date();
    const monthExpenses: Expense[] = [];
    const byCat: Record<string, number> = {};
    let monthTotal = 0;
    for (const e of expenses) {
      const d = new Date(e.spent_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        monthExpenses.push(e);
        monthTotal += Number(e.amount);
        byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
      }
    }
    const daysSoFar = now.getDate();
    const dailyAvg = daysSoFar > 0 ? monthTotal / daysSoFar : 0;
    const topCategoryId =
      Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      monthExpenses,
      monthTotal,
      dailyAvg,
      topCategoryId,
      count: monthExpenses.length,
    };
  }, [expenses]);

  const topCat = topCategoryId ? getCategory(topCategoryId) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      {/* 1. HERO — total monthly spending. Largest, highest contrast. */}
      <section className="pt-2 pb-10 md:pb-12">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
          {t("this_month")}
        </p>
        <h1 className="font-display tabular-nums tracking-tighter text-foreground text-7xl md:text-8xl lg:text-9xl leading-[0.95] mb-4">
          ${monthTotal.toFixed(2)}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md flex items-center gap-2">
          <span className="inline-block h-1 w-6 rounded-full bg-gradient-primary" />
          {count > 0
            ? `${count} ${t("entries_this_month").toLowerCase()}`
            : t("app_tagline")}
        </p>
      </section>

      {/* 2. SMART INSIGHT — second most prominent. */}
      <section className="mb-6">
        <AIInsight expenses={monthExpenses} />
      </section>

      {/* 3. SUPPORTING METRICS — quiet strip. Lower visual weight. */}
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">
            <CalendarDays className="h-3 w-3" />
            {t("daily_average_short")}
          </div>
          <p className="font-display text-xl tabular-nums text-foreground/90">
            ${dailyAvg.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">
            <TrendingUp className="h-3 w-3" />
            {t("entries_this_month")}
          </div>
          <p className="font-display text-xl tabular-nums text-foreground/90">{count}</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">
            <Sparkles className="h-3 w-3" />
            {t("most_used_category")}
          </div>
          {topCat ? (
            <p className="font-display text-xl flex items-center gap-1.5 text-foreground/90">
              <span className="text-base">{topCat.emoji}</span>
              <span className="truncate">{t(topCat.labelKey)}</span>
            </p>
          ) : (
            <p className="font-display text-base text-muted-foreground">
              {t("no_category_yet")}
            </p>
          )}
        </div>
      </div>

      {/* 4. CONTEXTUAL CARDS — leak + projection */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <BiggestLeak expenses={monthExpenses} />
        <SpendingProjection expenses={monthExpenses} />
      </section>

      {/* 5. RECENT + breakdown */}
      <div className="grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground/90">{t("recent")}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/history">
                {t("see_all")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {!loading && <ExpenseList expenses={expenses.slice(0, 8)} onDelete={onDelete} />}
        </section>

        <aside className="md:col-span-2 space-y-6">
          <CategoryChart expenses={monthExpenses} />
          <Button variant="outline" asChild className="w-full rounded-xl">
            <Link to="/insights">
              <TrendingUp className="h-4 w-4" />
              {t("deeper_insights")}
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
