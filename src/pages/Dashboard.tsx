import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AIInsight } from "@/components/AIInsight";
import { Button } from "@/components/ui/button";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const Dashboard = ({ expenses, loading, onDelete }: Props) => {
  const { monthTotal, todayTotal, count } = useMemo(() => {
    const now = new Date();
    let monthTotal = 0;
    let todayTotal = 0;
    let count = 0;
    for (const e of expenses) {
      const d = new Date(e.spent_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        monthTotal += Number(e.amount);
        count++;
        if (d.toDateString() === now.toDateString()) todayTotal += Number(e.amount);
      }
    }
    return { monthTotal, todayTotal, count };
  }, [expenses]);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      <section className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">This month</p>
        <h1 className="font-display text-5xl md:text-6xl tabular-nums mb-2">
          ${monthTotal.toFixed(2)}
        </h1>
        <p className="text-muted-foreground max-w-md">
          A friendlier way to keep tabs on your money — log fast, learn gently.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Today</p>
          <p className="font-display text-3xl tabular-nums">${todayTotal.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Entries this month</p>
          <p className="font-display text-3xl tabular-nums">{count}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Avg / entry</p>
          <p className="font-display text-3xl tabular-nums">
            ${count ? (monthTotal / count).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/history">
                See all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {!loading && <ExpenseList expenses={expenses.slice(0, 8)} onDelete={onDelete} />}
        </section>

        <aside className="md:col-span-2 space-y-6">
          <AIInsight expenses={expenses} />
          <CategoryBreakdown expenses={expenses.slice(0, 100)} />
          <Button variant="outline" asChild className="w-full rounded-xl">
            <Link to="/insights">
              <TrendingUp className="h-4 w-4" />
              Deeper insights
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
