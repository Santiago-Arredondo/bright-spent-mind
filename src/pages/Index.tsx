import { useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AIInsight } from "@/components/AIInsight";
import { toast } from "sonner";

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Couldn't load expenses");
    } else {
      setExpenses((data || []) as Expense[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addExpense = async (e: { amount: number; category: string; note?: string }) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ amount: e.amount, category: e.category, note: e.note ?? null })
      .select()
      .single();
    if (error) throw error;
    setExpenses((prev) => [data as Expense, ...prev]);
  };

  const deleteExpense = async (id: string) => {
    const prev = expenses;
    setExpenses((p) => p.filter((e) => e.id !== id));
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      setExpenses(prev);
      toast.error("Couldn't delete");
    } else {
      toast.success("Removed");
    }
  };

  const monthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.spent_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses]);

  return (
    <div className="min-h-screen bg-warm">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">Coin</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">This month</p>
            <h1 className="font-display text-5xl md:text-6xl tabular-nums">
              ${monthTotal.toFixed(2)}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-sm">
            A friendlier way to keep tabs on your money — log fast, learn gently.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3 space-y-6">
          <ExpenseForm onAdd={addExpense} />
          {!loading && <ExpenseList expenses={expenses.slice(0, 50)} onDelete={deleteExpense} />}
        </section>

        <aside className="md:col-span-2 space-y-6 md:sticky md:top-6 md:self-start">
          <AIInsight expenses={expenses} />
          <CategoryBreakdown expenses={expenses} />
        </aside>
      </main>
    </div>
  );
};

export default Index;
