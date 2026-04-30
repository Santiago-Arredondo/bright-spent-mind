import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "./IncomeForm";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (e: { amount: number; source: string; description?: string; received_at?: string }) => Promise<void>;
}

export const AddIncomeDialog = ({ open, onOpenChange, onAdd }: Props) => {
  const handleAdd = async (e: { amount: number; source: string; description?: string; received_at?: string }) => {
    await onAdd(e);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="sr-only">
          <DialogTitle>Add income</DialogTitle>
        </DialogHeader>
        <IncomeForm onSubmit={handleAdd} />
      </DialogContent>
    </Dialog>
  );
};
