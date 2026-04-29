import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const History = ({ expenses, loading, onDelete }: Props) => {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (query && !(e.note || "").toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [expenses, query, cat]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16">
      <section className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">History</p>
          <h1 className="font-display text-4xl md:text-5xl">All expenses</h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Filtered total</p>
          <p className="font-display text-3xl tabular-nums">${total.toFixed(2)}</p>
        </div>
      </section>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-card mb-6 space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl bg-secondary border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border",
              !cat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent"
            )}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id === cat ? null : c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border",
                cat === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-transparent hover:border-border"
              )}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!loading && <ExpenseList expenses={filtered} onDelete={onDelete} />}
    </div>
  );
};

export default History;
