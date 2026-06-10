import { Trash2, X, CheckSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BulkSelection } from "@/hooks/useBulkSelection";

interface Props {
  selection: BulkSelection;
  /** All visible (filtered) composite ids — "Select all" target. */
  visibleIds: string[];
  /** Called with selected composite ids when user confirms delete. */
  onDelete: (ids: string[]) => Promise<void> | void;
}

export const BulkActionBar = ({ selection, visibleIds, onDelete }: Props) => {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!selection.mode && selection.count === 0) return null;
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selection.selected.has(id));

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(Array.from(selection.selected));
      selection.exit();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 md:bottom-6 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:pb-0 animate-fade-in-up pointer-events-none">
        <div className="pointer-events-auto w-full md:w-auto md:max-w-2xl bg-card border border-border shadow-glow rounded-2xl md:rounded-full px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={selection.exit} aria-label={t("cancel")} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium tabular-nums">
            {t("bulk_selected_count").replace("{n}", String(selection.count))}
          </p>
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (allSelected ? selection.clear() : selection.selectAll(visibleIds))}
            className="rounded-full text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {allSelected ? t("bulk_deselect_all") : t("bulk_select_all")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={selection.count === 0 || busy}
            className="rounded-full ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("bulk_delete")}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulk_delete_confirm_title").replace("{n}", String(selection.count))}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("bulk_delete_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
