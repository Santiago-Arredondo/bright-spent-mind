import { Trash2 } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

export const ExpenseList = ({ expenses, onDelete }: Props) => {
  const { t, lang } = useLanguage();
  const locale = lang === "es" ? "es-ES" : "en-US";

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff < 1 && d.getDate() === now.getDate()) return t("today_label");
    if (diff < 2) return t("yesterday");
    return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-5xl mb-3">🪴</div>
        <p className="font-display text-xl mb-1">{t("empty_title")}</p>
        <p className="text-sm text-muted-foreground">{t("empty_sub")}</p>
      </div>
    );
  }

  const groups = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const k = formatDate(e.spent_at);
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  return (
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
                  className={`group flex items-center gap-3 p-4 ${
                    i !== items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.note || catLabel}</p>
                    <p className="text-xs text-muted-foreground">{catLabel}</p>
                  </div>
                  <p className="font-display text-lg tabular-nums">${Number(e.amount).toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(e.id)}
                    className="opacity-0 group-hover:opacity-100 transition-smooth h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
