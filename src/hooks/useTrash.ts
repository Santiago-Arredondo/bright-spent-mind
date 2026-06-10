import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Expense } from "@/components/ExpenseList";
import type { Income } from "@/hooks/useIncome";

export interface TrashedExpense extends Expense {
  deleted_at: string;
}
export interface TrashedIncome extends Income {
  deleted_at: string;
}

type ExpRow = {
  id: string; amount: number; category: string;
  description: string | null; date: string; deleted_at: string;
};
type IncRow = {
  id: string; amount: number; source: string;
  description: string | null; date: string; deleted_at: string;
};

export const useTrash = (onRestore?: () => void) => {
  const [expenses, setExpenses] = useState<TrashedExpense[]>([]);
  const [income, setIncome] = useState<TrashedIncome[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: exp, error: e1 }, { data: inc, error: e2 }] = await Promise.all([
      supabase.from("expenses").select("id,amount,category,description,date,deleted_at")
        .not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("income").select("id,amount,source,description,date,deleted_at")
        .not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    ]);
    if (e1 || e2) toast.error("Couldn't load trash");
    setExpenses(((exp as ExpRow[]) || []).map((r) => ({
      id: r.id, amount: Number(r.amount), category: r.category,
      note: r.description, spent_at: r.date, deleted_at: r.deleted_at,
    })));
    setIncome(((inc as IncRow[]) || []).map((r) => ({
      id: r.id, amount: Number(r.amount), source: r.source,
      description: r.description, received_at: r.date, deleted_at: r.deleted_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const restoreExpenses = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("expenses").update({ deleted_at: null }).in("id", ids);
    if (error) { toast.error("Couldn't restore"); return; }
    setExpenses((p) => p.filter((e) => !ids.includes(e.id)));
    onRestore?.();
  };
  const restoreIncome = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("income").update({ deleted_at: null }).in("id", ids);
    if (error) { toast.error("Couldn't restore"); return; }
    setIncome((p) => p.filter((i) => !ids.includes(i.id)));
    onRestore?.();
  };
  const purgeExpenses = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("expenses").delete().in("id", ids);
    if (error) { toast.error("Couldn't delete"); return; }
    setExpenses((p) => p.filter((e) => !ids.includes(e.id)));
  };
  const purgeIncome = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("income").delete().in("id", ids);
    if (error) { toast.error("Couldn't delete"); return; }
    setIncome((p) => p.filter((i) => !ids.includes(i.id)));
  };

  return { expenses, income, loading, reload: load,
    restoreExpenses, restoreIncome, purgeExpenses, purgeIncome };
};
