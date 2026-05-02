import { useMemo, useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeList } from "@/components/IncomeList";
import { EditIncomeDialog } from "@/components/EditIncomeDialog";
import { AddIncomeDialog } from "@/components/AddIncomeDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCOP } from "@/lib/money";
import { isSameMonth } from "@/lib/dateFormat";
import type { Income } from "@/hooks/useIncome";

interface Props {
  income: Income[];
  loading: boolean;
  onAdd: (e: { amount: number; source: string; description?: string; received_at?: string }) => Promise<void>;
  onUpdate: (
    id: string,
    patch: { amount: number; source: string; description?: string; received_at?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const IncomePage = ({ income, loading, onAdd, onUpdate, onDelete }: Props) => {
  const { t } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);

  const monthTotal = useMemo(() => {
    const now = new Date();
    return income
      .filter((i) => isSameMonth(i.received_at, now))
      .reduce((s, i) => s + Number(i.amount), 0);
  }, [income]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <section className="pt-2 pb-6 sm:pb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            {t("this_month")}
          </p>
          <h1 className="font-display tabular-nums tracking-tighter text-success text-5xl sm:text-6xl md:text-7xl leading-[0.95]">
            +{formatCOP(monthTotal, { decimals: 0 })}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{t("incomes")}</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="rounded-full bg-success hover:bg-success/90 text-success-foreground h-11 px-5 shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("add_income")}
        </Button>
      </section>

      <section>
        <h2 className="font-display text-xl text-foreground/90 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" />
          {t("income_history")}
        </h2>
        {!loading && <IncomeList income={income} onDelete={onDelete} onEdit={setEditing} />}
      </section>

      <AddIncomeDialog open={addOpen} onOpenChange={setAddOpen} onAdd={onAdd} />
      <EditIncomeDialog income={editing} onOpenChange={(o) => !o && setEditing(null)} onUpdate={onUpdate} />
    </div>
  );
};

export default IncomePage;
