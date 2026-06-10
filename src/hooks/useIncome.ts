import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { syncEmbeddings } from "@/lib/semanticSearch";

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  received_at: string;
}

type DbRow = {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  user_id: string;
  created_at: string;
};

const toIncome = (r: DbRow): Income => ({
  id: r.id,
  amount: Number(r.amount),
  source: r.source,
  description: r.description,
  received_at: r.date,
});

export const useIncome = () => {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(500);
    if (error) toast.error("Couldn't load income");
    else setIncome(((data as DbRow[]) || []).map(toIncome));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addIncome = async (e: { amount: number; source: string; description?: string; received_at?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      toast.error("Please sign in to add income");
      throw new Error("not_authenticated");
    }
    const { data, error } = await supabase
      .from("income")
      .insert({
        user_id: userId,
        amount: e.amount,
        source: e.source,
        description: e.description ?? null,
        ...(e.received_at ? { date: e.received_at.slice(0, 10) } : {}),
      })
      .select()
      .single();
    if (error) throw error;
    const next = toIncome(data as DbRow);
    setIncome((prev) => [next, ...prev].sort((a, b) => (a.received_at < b.received_at ? 1 : -1)));
    void syncEmbeddings();
  };

  const updateIncome = async (
    id: string,
    patch: { amount: number; source: string; description?: string; received_at?: string }
  ) => {
    const { data, error } = await supabase
      .from("income")
      .update({
        amount: patch.amount,
        source: patch.source,
        description: patch.description ?? null,
        embedding: null,
        embedding_model: null,
        ...(patch.received_at ? { date: patch.received_at.slice(0, 10) } : {}),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const next = toIncome(data as DbRow);
    setIncome((prev) =>
      prev
        .map((i) => (i.id === id ? next : i))
        .sort((a, b) => (a.received_at < b.received_at ? 1 : -1))
    );
    void syncEmbeddings();
  };

  /** Soft delete (moves to Trash). */
  const deleteIncome = async (id: string) => {
    const prev = income;
    setIncome((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase
      .from("income")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setIncome(prev);
      toast.error("Couldn't delete");
    } else {
      toast.success("Moved to Trash");
    }
  };

  const deleteIncomeBulk = async (ids: string[]): Promise<number> => {
    if (!ids.length) return 0;
    const prev = income;
    setIncome((p) => p.filter((i) => !ids.includes(i.id)));
    const { error } = await supabase
      .from("income")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      setIncome(prev);
      toast.error("Couldn't delete");
      return 0;
    }
    return ids.length;
  };

  return {
    income, loading, addIncome, updateIncome, deleteIncome,
    deleteIncomeBulk, reload: load,
  };
};
