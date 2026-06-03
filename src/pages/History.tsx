import { useMemo, useState } from "react";
import { Search, CalendarIcon, X, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { EditIncomeDialog } from "@/components/EditIncomeDialog";
import { type Expense } from "@/components/ExpenseList";
import { useCategories } from "@/contexts/CategoriesContext";
import { getIncomeSource } from "@/lib/incomeSources";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCOP } from "@/lib/money";
import { formatShortMonthDay, getCalendarDayDistance } from "@/lib/dateFormat";
import { parseLocalDate } from "@/lib/dateOnly";
import { filterTransactions } from "@/lib/search";
import type { Income } from "@/hooks/useIncome";

interface Props {
  expenses: Expense[];
  income: Income[];
  loading: boolean;
  onDeleteExpense: (id: string) => void;
  onDeleteIncome: (id: string) => Promise<void>;
  onUpdateExpense: (
    id: string,
    patch: { amount: number; category: string; note?: string; spent_at?: string }
  ) => Promise<void>;
  onUpdateIncome: (
    id: string,
    patch: { amount: number; source: string; description?: string; received_at?: string }
  ) => Promise<void>;
}

type TypeFilter = "all" | "expense" | "income";

type TimelineItem =
  | { kind: "expense"; date: string; data: Expense }
  | { kind: "income"; date: string; data: Income };

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

const History = ({
  expenses,
  income,
  loading,
  onDeleteExpense,
  onDeleteIncome,
  onUpdateExpense,
  onUpdateIncome,
}: Props) => {
  const { t, lang } = useLanguage();
  const { categories, getCategory } = useCategories();
  const dateLocale = lang === "es" ? esLocale : undefined;
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [cat, setCat] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "expense" | "income"; id: string } | null>(null);

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

  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [];
    if (type !== "income") {
      for (const e of expenses) {
        if (cat && e.category !== cat) continue;
        if (query && !(e.note || "").toLowerCase().includes(query.toLowerCase())) continue;
        const d = parseLocalDate(e.spent_at);
        if (from && d < from) continue;
        if (to && d > to) continue;
        list.push({ kind: "expense", date: e.spent_at, data: e });
      }
    }
    if (type !== "expense") {
      for (const i of income) {
        if (cat) continue; // category filter only applies to expenses
        if (query && !(i.description || "").toLowerCase().includes(query.toLowerCase())) continue;
        const d = parseLocalDate(i.received_at);
        if (from && d < from) continue;
        if (to && d > to) continue;
        list.push({ kind: "income", date: i.received_at, data: i });
      }
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, income, query, cat, from, to, type]);

  const totals = useMemo(() => {
    let inc = 0,
      exp = 0;
    for (const it of items) {
      if (it.kind === "expense") exp += Number(it.data.amount);
      else inc += Number(it.data.amount);
    }
    return { inc, exp, net: inc - exp };
  }, [items]);

  const formatDate = (iso: string) => {
    const diff = getCalendarDayDistance(iso);
    if (diff === 0) return t("today_label");
    if (diff === 1) return t("yesterday");
    return formatShortMonthDay(iso, lang);
  };

  const groups = items.reduce<Record<string, TimelineItem[]>>((acc, it) => {
    const k = formatDate(it.date);
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <section className="mb-6 sm:mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("history")}</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">{t("unified_title")}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("filtered_total")}</p>
          <p
            className={cn(
              "font-display text-2xl sm:text-3xl tabular-nums",
              totals.net >= 0 ? "text-success" : "text-alert"
            )}
          >
            {totals.net >= 0 ? "+" : "−"}
            {formatCOP(Math.abs(totals.net), { decimals: 0 })}
          </p>
        </div>
      </section>

      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card mb-6 space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_notes")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl bg-secondary border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-secondary rounded-full p-1 w-fit">
          {(["all", "expense", "income"] as TypeFilter[]).map((tk) => (
            <button
              key={tk}
              onClick={() => setType(tk)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-smooth",
                type === tk ? "bg-card shadow-card" : "text-muted-foreground"
              )}
            >
              {tk === "all" ? t("type_all") : tk === "expense" ? t("type_expenses") : t("type_income")}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("rounded-full bg-secondary border-transparent", !from && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("from")}: {from ? format(from, "PP", { locale: dateLocale }) : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={from} onSelect={(d) => setFrom(d ? startOfDay(d) : undefined)} initialFocus locale={dateLocale} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("rounded-full bg-secondary border-transparent", !to && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("to")}: {to ? format(to, "PP", { locale: dateLocale }) : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={to} onSelect={(d) => setTo(d ? endOfDay(d) : undefined)} initialFocus locale={dateLocale} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={clearDates} className="rounded-full text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              {t("clear")}
            </Button>
          )}

          <div className="flex flex-wrap gap-1.5 ml-auto">
            {(
              [
                ["today", t("preset_today")],
                ["7d", t("preset_7d")],
                ["30d", t("preset_30d")],
                ["month", t("preset_month")],
              ] as const
            ).map(([k, label]) => (
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

        {/* Categories (only for expenses) */}
        {type !== "income" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat(null)}
              className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border", !cat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent")}
            >
              {t("all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.slug === cat ? null : c.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border",
                  cat === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent hover:border-border"
                )}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t("no_results")}</p>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groups).map(([label, group]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">{label}</p>
              <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
                {group.map((it, i) => {
                  const isExpense = it.kind === "expense";
                  const cat = isExpense ? getCategory((it.data as Expense).category) : null;
                  const src = !isExpense ? getIncomeSource((it.data as Income).source) : null;
                  const label = isExpense
                    ? (it.data as Expense).note || cat!.name
                    : (it.data as Income).description || t(src!.labelKey);
                  const sub = isExpense ? cat!.name : t(src!.labelKey);
                  return (
                    <div
                      key={`${it.kind}-${it.data.id}`}
                      className={cn(
                        "group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 transition-smooth animate-fade-in-up hover:bg-muted/45 border-l-4",
                        isExpense ? "border-l-alert/60" : "border-l-success/60",
                        i !== group.length - 1 ? "border-b border-border" : ""
                      )}
                      style={{ animationDelay: `${Math.min(i * 30, 120)}ms` }}
                    >
                      <div
                        className={cn(
                          "h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0",
                          !isExpense && "bg-success-soft text-success"
                        )}
                        style={isExpense ? { backgroundColor: `hsl(${cat!.color} / 0.15)` } : undefined}
                      >
                        {isExpense ? cat!.icon : src!.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <p
                        className={cn(
                          "font-display text-base sm:text-lg tabular-nums",
                          isExpense ? "text-alert" : "text-success"
                        )}
                      >
                        {isExpense ? "−" : "+"}
                        {formatCOP(it.data.amount, { decimals: 0 })}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("edit")}
                          onClick={() =>
                            isExpense
                              ? setEditingExpense(it.data as Expense)
                              : setEditingIncome(it.data as Income)
                          }
                          className="md:opacity-0 md:group-hover:opacity-100 transition-smooth h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete")}
                          onClick={() => setPendingDelete({ kind: it.kind, id: it.data.id })}
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
      )}

      <EditExpenseDialog
        expense={editingExpense}
        onOpenChange={(o) => !o && setEditingExpense(null)}
        onUpdate={onUpdateExpense}
      />
      <EditIncomeDialog
        income={editingIncome}
        onOpenChange={(o) => !o && setEditingIncome(null)}
        onUpdate={onUpdateIncome}
      />
      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            if (pendingDelete.kind === "expense") onDeleteExpense(pendingDelete.id);
            else onDeleteIncome(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
};

export default History;
