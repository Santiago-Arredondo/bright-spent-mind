import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Expense } from "@/components/ExpenseList";
import { toast } from "sonner";
import { syncEmbeddings } from "@/lib/semanticSearch";

// DB row shape (new schema) → app shape (Expense)
type DbRow = {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  user_id: string;
  created_at: string;
};

const toExpense = (r: DbRow): Expense => ({
  id: r.id,
  amount: Number(r.amount),
  category: r.category,
  note: r.description,
  spent_at: r.date,
});

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);
    if (error) toast.error("Couldn't load expenses");
    else setExpenses(((data as DbRow[]) || []).map(toExpense));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addExpense = async (e: { amount: number; category: string; note?: string; spent_at?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      toast.error("Please sign in to add expenses");
      throw new Error("not_authenticated");
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        amount: e.amount,
        category: e.category,
        description: e.note ?? null,
        ...(e.spent_at ? { date: e.spent_at.slice(0, 10) } : {}),
      })
      .select()
      .single();
    if (error) throw error;
    const next = toExpense(data as DbRow);
    setExpenses((prev) =>
      [next, ...prev].sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1))
    );
  };

  const updateExpense = async (
    id: string,
    patch: { amount: number; category: string; note?: string; spent_at?: string }
  ) => {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        amount: patch.amount,
        category: patch.category,
        description: patch.note ?? null,
        ...(patch.spent_at ? { date: patch.spent_at.slice(0, 10) } : {}),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const next = toExpense(data as DbRow);
    setExpenses((prev) =>
      prev
        .map((e) => (e.id === id ? next : e))
        .sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1))
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

  return { expenses, loading, addExpense, updateExpense, deleteExpense, reload: load };
};
