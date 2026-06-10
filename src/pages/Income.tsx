import { useMemo, useState } from "react";
import { Plus, TrendingUp, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeList } from "@/components/IncomeList";
import { BulkActionBar } from "@/components/BulkActionBar";
import { EditIncomeDialog } from "@/components/EditIncomeDialog";
import { AddIncomeDialog } from "@/components/AddIncomeDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCOP } from "@/lib/money";
import { isSameMonth } from "@/lib/dateFormat";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { splitSelection } from "@/lib/bulkActions";
import { toast } from "sonner";
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
  onDeleteBulk: (ids: string[]) => Promise<number>;
}

const IncomePage = ({ income, loading, onAdd, onUpdate, onDelete, onDeleteBulk }: Props) => {
  const { t } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const selection = useBulkSelection();

  const monthTotal = useMemo(() => {
    const now = new Date();
    return income.filter((i) => isSameMonth(i.received_at, now)).reduce((s, i) => s + Number(i.amount), 0);
  }, [income]);

  const visibleIds = useMemo(() => income.map((i) => `income:${i.id}`), [income]);

  const handleBulkDelete = async (ids: string[]) => {
    const { income: incIds } = splitSelection(ids);
    const n = await onDeleteBulk(incIds);
    if (n > 0) toast.success(t("bulk_deleted_toast").replace("{n}", String(n)));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-28">
      <section className="pt-2 pb-6 sm:pb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{t("this_month")}</p>
          <h1 className="font-display tabular-nums tracking-tighter text-success text-5xl sm:text-6xl md:text-7xl leading-[0.95]">
            +{formatCOP(monthTotal, { decimals: 0 })}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{t("incomes")}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-full bg-success hover:bg-success/90 text-success-foreground h-11 px-5 shadow-glow">
          <Plus className="h-4 w-4" />{t("add_income")}
        </Button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-foreground/90 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />{t("income_history")}
          </h2>
          <Button
            variant={selection.mode ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => (selection.mode ? selection.exit() : selection.enter())}
            disabled={income.length === 0}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selection.mode ? t("cancel") : t("bulk_select")}
          </Button>
        </div>
        {!loading && <IncomeList income={income} onDelete={onDelete} onEdit={setEditing} selection={selection} />}
      </section>

      <AddIncomeDialog open={addOpen} onOpenChange={setAddOpen} onAdd={onAdd} />
      <EditIncomeDialog income={editing} onOpenChange={(o) => !o && setEditing(null)} onUpdate={onUpdate} />
      <BulkActionBar selection={selection} visibleIds={visibleIds} onDelete={handleBulkDelete} />
    </div>
  );
};

export default IncomePage;
