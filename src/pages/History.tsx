import { useMemo, useState } from "react";
import { Search, CalendarIcon, X, LayoutList, FolderTree } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpenseList, type Expense } from "@/components/ExpenseList";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCOP } from "@/lib/money";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
}

type GroupMode = "date" | "category";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const History = ({ expenses, loading, onDelete }: Props) => {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "es" ? esLocale : undefined;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [group, setGroup] = useState<GroupMode>("date");

  const applyPreset = (preset: "today" | "7d" | "30d" | "month") => {
    const now = new Date();
    if (preset === "today") {
      setFrom(startOfDay(now));
      setTo(endOfDay(now));
    } else if (preset === "7d") {
      const f = new Date(now);
      f.setDate(now.getDate() - 6);
      setFrom(startOfDay(f));
      setTo(endOfDay(now));
    } else if (preset === "30d") {
      const f = new Date(now);
      f.setDate(now.getDate() - 29);
      setFrom(startOfDay(f));
      setTo(endOfDay(now));
    } else {
      setFrom(startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)));
      setTo(endOfDay(now));
    }
  };

  const clearDates = () => {
    setFrom(undefined);
    setTo(undefined);
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (query && !(e.note || "").toLowerCase().includes(query.toLowerCase())) return false;
      const d = new Date(e.spent_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [expenses, query, cat, from, to]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const grouped = useMemo(() => {
    if (group !== "category") return null;
    const map: Record<string, { total: number; items: Expense[] }> = {};
    for (const e of filtered) {
      (map[e.category] ||= { total: 0, items: [] }).items.push(e);
      map[e.category].total += Number(e.amount);
    }
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, group]);

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16">
      <section className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("history")}</p>
          <h1 className="font-display text-4xl md:text-5xl">{t("all_expenses")}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("filtered_total")}</p>
          <p className="font-display text-3xl tabular-nums">{formatCOP(total)}</p>
        </div>
      </section>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-card mb-6 space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_notes")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl bg-secondary border-transparent"
          />
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full bg-secondary border-transparent hover:bg-secondary",
                  !from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("from")}: {from ? format(from, "PP", { locale: dateLocale }) : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={(d) => setFrom(d ? startOfDay(d) : undefined)}
                initialFocus
                locale={dateLocale}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full bg-secondary border-transparent hover:bg-secondary",
                  !to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("to")}: {to ? format(to, "PP", { locale: dateLocale }) : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={(d) => setTo(d ? endOfDay(d) : undefined)}
                initialFocus
                locale={dateLocale}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={clearDates} className="rounded-full text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              {t("clear")}
            </Button>
          )}

          <div className="flex flex-wrap gap-1.5 ml-auto">
            {([
              ["today", t("preset_today")],
              ["7d", t("preset_7d")],
              ["30d", t("preset_30d")],
              ["month", t("preset_month")],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => applyPreset(k)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary hover:bg-muted transition-smooth"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border",
              !cat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent"
            )}
          >
            {t("all")}
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
              <span>{t(c.labelKey)}</span>
            </button>
          ))}
        </div>

        {/* Group toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-full p-1 w-fit">
          <button
            onClick={() => setGroup("date")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-smooth",
              group === "date" ? "bg-card shadow-card" : "text-muted-foreground"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            {t("group_by_date")}
          </button>
          <button
            onClick={() => setGroup("category")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-smooth",
              group === "category" ? "bg-card shadow-card" : "text-muted-foreground"
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            {t("group_by_category")}
          </button>
        </div>
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t("no_results")}</p>
      )}

      {!loading && filtered.length > 0 && group === "date" && (
        <ExpenseList expenses={filtered} onDelete={onDelete} />
      )}

      {!loading && filtered.length > 0 && group === "category" && grouped && (
        <div className="space-y-4">
          {grouped.map((g) => {
            const c = getCategory(g.id);
            return (
              <div key={g.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-secondary/50">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `hsl(${c.color} / 0.2)` }}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg">{t(c.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.items.length} {g.items.length === 1 ? "·" : "·"}
                    </p>
                  </div>
                  <p className="font-display text-xl tabular-nums">{formatCOP(g.total)}</p>
                </div>
                <ExpenseList expenses={g.items} onDelete={onDelete} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
