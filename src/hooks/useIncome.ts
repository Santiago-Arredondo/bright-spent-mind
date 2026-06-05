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
  };

  const deleteIncome = async (id: string) => {
    const prev = income;
    setIncome((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) {
      setIncome(prev);
      toast.error("Couldn't delete");
    } else {
      toast.success("Removed");
    }
  };

  return { income, loading, addIncome, updateIncome, deleteIncome, reload: load };
};
