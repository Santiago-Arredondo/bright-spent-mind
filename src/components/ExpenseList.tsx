import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEmptyMessage } from "@/hooks/useEmptyMessage";
import { formatCOP } from "@/lib/money";
import { formatShortMonthDay, getCalendarDayDistance } from "@/lib/dateFormat";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  spent_at: string;
}

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export const ExpenseList = ({ expenses, onDelete, onEdit }: Props) => {
  const { t, lang } = useLanguage();
  const emptyMsg = useEmptyMessage("list");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const formatDate = (iso: string) => {
    const diff = getCalendarDayDistance(iso);
    if (diff === 0) return t("today_label");
    if (diff === 1) return t("yesterday");
    return formatShortMonthDay(iso, lang);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 px-6 animate-fade-in-up">
        <div className="text-5xl mb-3">🪴</div>
        <p className="font-display text-xl mb-1">{t("empty_title")}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyMsg}</p>
      </div>
    );
  }

  const groups = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const k = formatDate(e.spent_at);
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groups).map(([label, items]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">{label}</p>
            <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              {items.map((e, i) => {
                const cat = getCategory(e.category);
                const catLabel = t(cat.labelKey);
                return (
                  <div
                    key={e.id}
                    className={`group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 transition-smooth animate-fade-in-up hover:bg-muted/45 ${
                      i !== items.length - 1 ? "border-b border-border" : ""
                    }`}
                    style={{ animationDelay: `${Math.min(i * 35, 140)}ms` }}
                  >
                    <div
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0 transition-smooth group-hover:scale-110"
                      style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{e.note || catLabel}</p>
                      <p className="text-xs text-muted-foreground">{catLabel}</p>
                    </div>
                    <p className="font-display text-base sm:text-lg tabular-nums text-alert">
                      −{formatCOP(e.amount, { decimals: 0 })}
                    </p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(e)}
                          aria-label={t("edit")}
                          className="md:opacity-0 md:group-hover:opacity-100 transition-smooth h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(e.id)}
                        aria-label={t("delete")}
                        className="md:opacity-0 md:group-hover:opacity-100 transition-smooth h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
};
