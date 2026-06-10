import { useMemo, useState } from "react";
import { RotateCcw, Trash2, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTrash } from "@/hooks/useTrash";
import { useCategories } from "@/contexts/CategoriesContext";
import { getIncomeSource } from "@/lib/incomeSources";
import { formatCOP } from "@/lib/money";
import { formatShortMonthDay } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const daysLeft = (deletedAt: string): number => {
  const ms = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

const Trash = () => {
  const { t, lang } = useLanguage();
  const { getCategory } = useCategories();
  const {
    expenses, income, loading,
    restoreExpenses, restoreIncome, purgeExpenses, purgeIncome,
  } = useTrash();

  const [tab, setTab] = useState<"expenses" | "income">("expenses");
  const [selExp, setSelExp] = useState<Set<string>>(new Set());
  const [selInc, setSelInc] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const toggle = (kind: "exp" | "inc", id: string) => {
    const set = kind === "exp" ? selExp : selInc;
    const setter = kind === "exp" ? setSelExp : setSelInc;
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const activeIds = tab === "expenses" ? selExp : selInc;
  const activeAll = tab === "expenses" ? expenses : income;
  const setActive = tab === "expenses" ? setSelExp : setSelInc;
  const allSelected = activeAll.length > 0 && activeAll.every((it) => activeIds.has(it.id));

  const handleRestore = async () => {
    if (tab === "expenses") {
      await restoreExpenses(Array.from(selExp));
      setSelExp(new Set());
    } else {
      await restoreIncome(Array.from(selInc));
      setSelInc(new Set());
    }
    toast.success(t("trash_restored_toast"));
  };

  const handlePurge = async () => {
    if (tab === "expenses") {
      await purgeExpenses(Array.from(selExp));
      setSelExp(new Set());
    } else {
      await purgeIncome(Array.from(selInc));
      setSelInc(new Set());
    }
    setConfirming(false);
    toast.success(t("trash_purged_toast"));
  };

  const emptyAll = !loading && expenses.length === 0 && income.length === 0;

  const count = activeIds.size;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <section className="pt-2 pb-6 sm:pb-8">
        <p className="text-sm text-muted-foreground mb-1">{t("nav_trash")}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2">{t("trash_title")}</h1>
        <p className="text-muted-foreground max-w-xl text-sm sm:text-base">{t("trash_subtitle")}</p>
      </section>

      {emptyAll ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <div className="text-5xl mb-3">🗑️</div>
          <p className="text-muted-foreground">{t("trash_empty")}</p>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "expenses" | "income")}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="expenses">
                <Receipt className="h-4 w-4" />
                {t("type_expenses")} ({expenses.length})
              </TabsTrigger>
              <TabsTrigger value="income">
                <TrendingUp className="h-4 w-4" />
                {t("type_income")} ({income.length})
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                size="sm" variant="outline" className="rounded-full"
                onClick={() => setActive(allSelected ? new Set() : new Set(activeAll.map((i) => i.id)))}
                disabled={activeAll.length === 0}
              >
                {allSelected ? t("bulk_deselect_all") : t("bulk_select_all")}
              </Button>
              <Button
                size="sm" variant="outline" className="rounded-full"
                onClick={handleRestore} disabled={count === 0}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("trash_restore")}
              </Button>
              <Button
                size="sm" variant="destructive" className="rounded-full"
                onClick={() => setConfirming(true)} disabled={count === 0}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("trash_delete_forever")}
              </Button>
            </div>
          </div>

          <TabsContent value="expenses" className="mt-0">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("trash_empty")}</p>
            ) : (
              <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
                {expenses.map((e, i) => {
                  const cat = getCategory(e.category);
                  const left = daysLeft(e.deleted_at);
                  const selected = selExp.has(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => toggle("exp", e.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 sm:p-4 cursor-pointer transition-smooth hover:bg-muted/45",
                        i !== expenses.length - 1 && "border-b border-border",
                        selected && "bg-primary/5"
                      )}
                    >
                      <Checkbox checked={selected} onCheckedChange={() => toggle("exp", e.id)} onClick={(ev) => ev.stopPropagation()} className="h-5 w-5" />
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{e.note || cat.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cat.name} · {t("trash_deleted_on")} {formatShortMonthDay(e.deleted_at, lang)} · {t("trash_days_left").replace("{n}", String(left))}
                        </p>
                      </div>
                      <p className="font-display text-base tabular-nums text-muted-foreground">
                        −{formatCOP(e.amount, { decimals: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="income" className="mt-0">
            {income.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("trash_empty")}</p>
            ) : (
              <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
                {income.map((it, i) => {
                  const src = getIncomeSource(it.source);
                  const left = daysLeft(it.deleted_at);
                  const selected = selInc.has(it.id);
                  return (
                    <div
                      key={it.id}
                      onClick={() => toggle("inc", it.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 sm:p-4 cursor-pointer transition-smooth hover:bg-muted/45",
                        i !== income.length - 1 && "border-b border-border",
                        selected && "bg-primary/5"
                      )}
                    >
                      <Checkbox checked={selected} onCheckedChange={() => toggle("inc", it.id)} onClick={(ev) => ev.stopPropagation()} className="h-5 w-5" />
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-base shrink-0 bg-success-soft text-success">
                        {src.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{it.description || t(src.labelKey)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t(src.labelKey)} · {t("trash_deleted_on")} {formatShortMonthDay(it.deleted_at, lang)} · {t("trash_days_left").replace("{n}", String(left))}
                        </p>
                      </div>
                      <p className="font-display text-base tabular-nums text-muted-foreground">
                        +{formatCOP(it.amount, { decimals: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("trash_purge_confirm_title").replace("{n}", String(count))}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("trash_purge_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handlePurge(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("trash_delete_forever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trash;
