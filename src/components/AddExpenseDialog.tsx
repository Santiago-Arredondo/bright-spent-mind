import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "./ExpenseForm";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (e: { amount: number; category: string; note?: string }) => Promise<void>;
}

export const AddExpenseDialog = ({ open, onOpenChange, onAdd }: Props) => {
  const handleAdd = async (e: { amount: number; category: string; note?: string }) => {
    await onAdd(e);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm onAdd={handleAdd} />
      </DialogContent>
    </Dialog>
  );
};
