import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Expense } from "@/components/ExpenseList";
import { toast } from "sonner";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Couldn't load expenses");
    else setExpenses((data || []) as Expense[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addExpense = async (e: { amount: number; category: string; note?: string; spent_at?: string }) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        amount: e.amount,
        category: e.category,
        note: e.note ?? null,
        ...(e.spent_at ? { spent_at: e.spent_at } : {}),
      })
      .select()
      .single();
    if (error) throw error;
    setExpenses((prev) =>
      [data as Expense, ...prev].sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1))
    );
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

  return { expenses, loading, addExpense, deleteExpense, reload: load };
};
