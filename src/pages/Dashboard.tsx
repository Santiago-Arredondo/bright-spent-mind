import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, CalendarDays, Sparkles } from "lucide-react";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CategoryChart } from "@/components/CategoryChart";
import { AIInsight } from "@/components/AIInsight";
import { SpendingProjection } from "@/components/SpendingProjection";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategory } from "@/lib/categories";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
}

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
      <section className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">{t("this_month")}</p>
        <h1 className="font-display text-5xl md:text-6xl tabular-nums mb-2">
          ${monthTotal.toFixed(2)}
        </h1>
        <p className="text-muted-foreground max-w-md">{t("app_tagline")}</p>
      </section>

      {/* Top stat cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("total_spending")}
          </div>
          <p className="font-display text-3xl tabular-nums">${monthTotal.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {count} {t("entries_this_month").toLowerCase()}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("daily_average_short")}
          </div>
          <p className="font-display text-3xl tabular-nums">${dailyAvg.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("this_month")}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t("most_used_category")}
          </div>
          {topCat ? (
            <p className="font-display text-3xl flex items-center gap-2">
              <span>{topCat.emoji}</span>
              <span>{t(topCat.labelKey)}</span>
            </p>
          ) : (
            <p className="font-display text-2xl text-muted-foreground">
              {t("no_category_yet")}
            </p>
          )}
        </div>
      </div>

      {/* Smart Insight + Projection */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <AIInsight expenses={monthExpenses} />
        <SpendingProjection expenses={monthExpenses} />
      </section>

      <div className="grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{t("recent")}</h2>
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
