import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, CalendarIcon, X, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncome } from "@/hooks/useIncome";
import { useCategories } from "@/contexts/CategoriesContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/money";
import { formatShortMonthDay, getCalendarDayDistance } from "@/lib/dateFormat";
import { getIncomeSource } from "@/lib/incomeSources";
import {
  filterTransactions,
  summarize,
  highlightSegments,
  type SearchFilters,
} from "@/lib/search";
import { semanticSearch, syncEmbeddings, type SemanticScore } from "@/lib/semanticSearch";
import type { Expense } from "@/components/ExpenseList";
import type { Income } from "@/hooks/useIncome";

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

const HL = ({ text, query }: { text: string; query: string }) => {
  const segs = highlightSegments(text, query);
  return (
    <>
      {segs.map((s, i) =>
        s.match ? (
          <mark key={i} className="bg-primary/25 text-foreground rounded px-0.5">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
};

const SearchPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { expenses, loading: lExp } = useExpenses();
  const { income, loading: lInc } = useIncome();
  const { categories, getCategory } = useCategories();
  const dateLocale = lang === "es" ? esLocale : undefined;

  const [semantic, setSemantic] = useState<SemanticScore>(new Map());

  // Best-effort backfill embeddings once per session for this user.
  useEffect(() => {
    if (!user?.id) return;
    const key = `flowbit_emb_sync_${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    syncEmbeddings();
  }, [user?.id]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchFilters["type"]>("all");
  const [cat, setCat] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  const filters = useMemo<SearchFilters>(
    () => ({
      query,
      type,
      category: cat,
      from,
      to,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
    }),
    [query, type, cat, from, to, minAmount, maxAmount]
  );

  // Debounced semantic search (only when query has enough signal)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || !user?.id) {
      setSemantic(new Map());
      return;
    }
    const handle = setTimeout(async () => {
      const map = await semanticSearch(q, user.id);
      setSemantic(map);
    }, 350);
    return () => clearTimeout(handle);
  }, [query, user?.id]);

  const items = useMemo(
    () => filterTransactions(expenses, income, filters, categories, lang, semantic),
    [expenses, income, filters, categories, lang, semantic]
  );
  const summary = useMemo(() => summarize(items, categories), [items, categories]);

  const applyPreset = (preset: "today" | "7d" | "month" | "30d") => {
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

  const clearAll = () => {
    setQuery("");
    setType("all");
    setCat(null);
    setFrom(undefined);
    setTo(undefined);
    setMinAmount("");
    setMaxAmount("");
  };

  const hasAnyFilter =
    query || type !== "all" || cat || from || to || minAmount || maxAmount;
  const loading = lExp || lInc;

  const formatDate = (iso: string) => {
    const diff = getCalendarDayDistance(iso);
    if (diff === 0) return t("today_label");
    if (diff === 1) return t("yesterday");
    return formatShortMonthDay(iso, lang);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <section className="pt-2 pb-6 sm:pb-8">
        <p className="text-sm text-muted-foreground mb-1">{t("nav_search")}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2">
          {t("search_title")}
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
          {t("search_subtitle")}
        </p>
      </section>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card mb-6 space-y-4">
        <div className="relative">
          <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl bg-secondary border-transparent"
            autoFocus
          />
        </div>

        {/* Type */}
        <div className="flex items-center gap-1 bg-secondary rounded-full p-1 w-fit">
          {(["all", "expense", "income"] as const).map((tk) => (
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
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full bg-secondary border-transparent",
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
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full bg-secondary border-transparent",
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
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

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

        {/* Amount range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("search_min")}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="h-8 w-28 rounded-full bg-secondary border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("search_max")}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="∞"
              className="h-8 w-28 rounded-full bg-secondary border-transparent text-sm"
            />
          </div>

          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="rounded-full text-muted-foreground ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              {t("clear")}
            </Button>
          )}
        </div>

        {/* Categories */}
        {type !== "income" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth border",
                !cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-transparent"
              )}
            >
              {t("all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.slug === cat ? null : c.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border",
                  cat === c.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary border-transparent hover:border-border"
                )}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {t("search_count")}
            </p>
            <p className="font-display text-xl sm:text-2xl tabular-nums">{summary.count}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {t("search_total_spent")}
            </p>
            <p className="font-display text-xl sm:text-2xl tabular-nums text-alert break-all">
              {formatCOP(summary.totalExpenses, { decimals: 0 })}
            </p>
            {summary.totalIncome > 0 && (
              <p className="text-xs text-success tabular-nums mt-1">
                +{formatCOP(summary.totalIncome, { decimals: 0 })}
              </p>
            )}
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {t("search_average")}
            </p>
            <p className="font-display text-xl sm:text-2xl tabular-nums break-all">
              {formatCOP(summary.avgExpense || summary.avgIncome, { decimals: 0 })}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-card">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {t("search_top_category")}
            </p>
            {summary.topCategory ? (
              <p className="font-display text-base sm:text-lg flex items-center gap-1.5 truncate">
                <span>{summary.topCategory.icon}</span>
                <span className="truncate">{summary.topCategory.name}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl border border-border bg-card/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <div className="text-5xl mb-3">🔎</div>
          <p className="font-display text-xl mb-1">{t("search_empty_title")}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {t("search_empty_sub")}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {items.map((it, i) => {
            const isExpense = it.kind === "expense";
            const catMeta = isExpense ? getCategory((it.data as Expense).category) : null;
            const srcMeta = !isExpense ? getIncomeSource((it.data as Income).source) : null;
            const primary = isExpense
              ? (it.data as Expense).note || catMeta!.name
              : (it.data as Income).description || t(srcMeta!.labelKey);
            const sub = isExpense ? catMeta!.name : t(srcMeta!.labelKey);
            return (
              <div
                key={`${it.kind}-${it.data.id}`}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 transition-smooth animate-fade-in-up hover:bg-muted/45 border-l-4",
                  isExpense ? "border-l-alert/60" : "border-l-success/60",
                  i !== items.length - 1 ? "border-b border-border" : ""
                )}
                style={{ animationDelay: `${Math.min(i * 25, 120)}ms` }}
              >
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0",
                    !isExpense && "bg-success-soft text-success"
                  )}
                  style={
                    isExpense ? { backgroundColor: `hsl(${catMeta!.color} / 0.15)` } : undefined
                  }
                >
                  {isExpense ? catMeta!.icon : srcMeta!.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm sm:text-base">
                    <HL text={primary} query={query} />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    <HL text={sub} query={query} /> · {formatDate(it.date)}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-display text-base sm:text-lg tabular-nums shrink-0",
                    isExpense ? "text-alert" : "text-success"
                  )}
                >
                  {isExpense ? "−" : "+"}
                  {formatCOP(it.amount, { decimals: 0 })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
