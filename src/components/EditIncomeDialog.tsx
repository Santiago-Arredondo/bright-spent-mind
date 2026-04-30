import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "./IncomeForm";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Income } from "@/hooks/useIncome";
import { toast } from "sonner";

interface Props {
  income: Income | null;
  onOpenChange: (o: boolean) => void;
  onUpdate: (
    id: string,
    patch: { amount: number; source: string; description?: string; received_at?: string }
  ) => Promise<void>;
}

export const EditIncomeDialog = ({ income, onOpenChange, onUpdate }: Props) => {
  const { t } = useLanguage();
  const open = !!income;

  const handleSubmit = async (e: { amount: number; source: string; description?: string; received_at?: string }) => {
    if (!income) return;
    try {
      await onUpdate(income.id, e);
      toast.success(t("income_updated"));
      onOpenChange(false);
    } catch {
      toast.error(t("save_error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("edit_income")}</DialogTitle>
        </DialogHeader>
        {income && (
          <IncomeForm
            initial={{
              amount: income.amount,
              source: income.source,
              description: income.description,
              received_at: income.received_at,
            }}
            submitLabel={t("save")}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
