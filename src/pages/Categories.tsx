import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Tag } from "lucide-react";
import { useCategories, type Category } from "@/contexts/CategoriesContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PALETTE, ICON_CHOICES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CategoryFormDialog = ({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Category | null;
  onSave: (input: { name: string; color: string; icon: string }) => Promise<void>;
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PALETTE[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICON_CHOICES[0]);
  const [busy, setBusy] = useState(false);

  // Reset on open
  useMemo(() => {
    if (open) {
      setName(initial?.name ?? "");
      setColor(initial?.color ?? PALETTE[0]);
      setIcon(initial?.icon ?? ICON_CHOICES[0]);
    }
  }, [open, initial]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("cat_name_required"));
      return;
    }
    setBusy(true);
    try {
      await onSave({ name: trimmed, color, icon });
      onOpenChange(false);
    } catch (e) {
      toast.error(t("save_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? t("cat_edit_title") : t("cat_new_title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `hsl(${color} / 0.18)` }}
            >
              {icon}
            </div>
            <p className="font-display text-lg">{name || t("cat_name_placeholder")}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("cat_name")}</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder={t("cat_name_placeholder")}
              className="rounded-xl bg-secondary border-transparent"
              autoFocus
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("cat_icon")}</p>
            <div className="grid grid-cols-8 gap-2">
              {ICON_CHOICES.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-smooth",
                    icon === i ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary hover:bg-muted"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("cat_color")}</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setColor(p)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-smooth ring-offset-2 ring-offset-background",
                    color === p ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: `hsl(${p})` }}
                  aria-label={p}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim()} className="bg-gradient-primary">
            {busy ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteCategoryDialog = ({
  open, onOpenChange, target, usageCount, otherCategories, onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  target: Category | null;
  usageCount: number;
  otherCategories: Category[];
  onConfirm: (opts?: { reassignTo?: string }) => Promise<void>;
}) => {
  const { t } = useLanguage();
  const [reassignTo, setReassignTo] = useState<string>("");
  const [mode, setMode] = useState<"reassign" | "block">("reassign");
  const [busy, setBusy] = useState(false);

  useMemo(() => {
    if (open) {
      setReassignTo(otherCategories[0]?.id ?? "");
      setMode("reassign");
    }
  }, [open, otherCategories]);

  const handle = async () => {
    if (usageCount > 0 && mode === "block") {
      toast.error(t("cat_delete_blocked"));
      return;
    }
    setBusy(true);
    try {
      await onConfirm(usageCount > 0 ? { reassignTo } : undefined);
      onOpenChange(false);
    } catch (e) {
      toast.error(t("delete_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("cat_delete_title")} {target ? `"${target.name}"` : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {usageCount > 0
              ? t("cat_delete_has_expenses").replace("{n}", String(usageCount))
              : t("cat_delete_safe")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {usageCount > 0 && (
          <div className="space-y-3 py-2">
            <label className="flex items-start gap-2 p-3 rounded-xl bg-secondary cursor-pointer">
              <input
                type="radio"
                checked={mode === "reassign"}
                onChange={() => setMode("reassign")}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("cat_delete_reassign")}</p>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  disabled={mode !== "reassign"}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="flex items-start gap-2 p-3 rounded-xl bg-secondary cursor-pointer">
              <input
                type="radio"
                checked={mode === "block"}
                onChange={() => setMode("block")}
                className="mt-1"
              />
              <p className="text-sm font-medium">{t("cat_delete_block")}</p>
            </label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handle(); }}
            disabled={busy || (usageCount > 0 && mode === "reassign" && !reassignTo)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? t("saving") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const Categories = () => {
  const { t } = useLanguage();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { expenses } = useExpenses();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) map[e.category] = (map[e.category] || 0) + 1;
    return map;
  }, [expenses]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
      <section className="pt-2 pb-6 sm:pb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("nav_categories")}</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">{t("cat_manage_title")}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
            {t("cat_manage_subtitle")}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-gradient-primary shadow-glow shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("cat_new")}</span>
        </Button>
      </section>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-card/60 border border-border animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("cat_empty")}</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {categories.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-3 p-4 transition-smooth hover:bg-muted/45",
                i !== categories.length - 1 && "border-b border-border"
              )}
            >
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `hsl(${c.color} / 0.18)` }}
              >
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(usage[c.slug] || 0)} {t("cat_expenses_using")}
                </p>
              </div>
              <span
                className="hidden sm:inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: `hsl(${c.color})` }}
                aria-hidden
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(c)}
                aria-label={t("edit")}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleting(c)}
                aria-label={t("delete")}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSave={async (input) => {
          await createCategory(input);
          toast.success(t("cat_created"));
        }}
      />
      <CategoryFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing}
        onSave={async (input) => {
          if (!editing) return;
          await updateCategory(editing.id, input);
          toast.success(t("cat_updated"));
        }}
      />
      <DeleteCategoryDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        target={deleting}
        usageCount={deleting ? (usage[deleting.slug] || 0) : 0}
        otherCategories={categories.filter((c) => c.id !== deleting?.id)}
        onConfirm={async (opts) => {
          if (!deleting) return;
          await deleteCategory(deleting.id, opts);
          toast.success(t("cat_deleted"));
        }}
      />
    </div>
  );
};

export default Categories;
