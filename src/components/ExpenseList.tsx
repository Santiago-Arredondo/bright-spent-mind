import { Trash2 } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";

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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 1 && d.getDate() === now.getDate()) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const ExpenseList = ({ expenses, onDelete }: Props) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-5xl mb-3">🪴</div>
        <p className="font-display text-xl mb-1">Nothing here yet</p>
        <p className="text-sm text-muted-foreground">Add your first expense to get started.</p>
      </div>
    );
  }

  // group by date label
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
                    <p className="font-medium truncate">{e.note || cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.label}</p>
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
