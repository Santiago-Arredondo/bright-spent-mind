import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}

export const ConfirmDeleteDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const { t } = useLanguage();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirm_delete_title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirm_delete_desc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Helper hook
export const useConfirmDelete = () => {
  const [pending, setPending] = useState<(() => void) | null>(null);
  return {
    open: !!pending,
    onOpenChange: (o: boolean) => !o && setPending(null),
    confirm: () => {
      pending?.();
      setPending(null);
    },
    request: (action: () => void) => setPending(() => action),
  };
};
