import { useEffect, useRef, useState } from "react";
import { Plus, CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCategories } from "@/contexts/CategoriesContext";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryOverrides } from "@/hooks/useCategoryOverrides";
import { suggestCategory } from "@/lib/categorizer";
import { toLocalDateString } from "@/lib/dateOnly";

const schema = z.object({
  amount: z.number().positive().max(10_000_000_000),
  category: z.string().min(1),
  note: z.string().max(140).optional(),
  spent_at: z.date(),
});

interface Props {
  onAdd: (e: { amount: number; category: string; note?: string; spent_at?: string }) => Promise<void>;
}

export const ExpenseForm = ({ onAdd }: Props) => {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "es" ? esLocale : undefined;
  const { overrides, remember } = useCategoryOverrides();
  const { categories, getCategory } = useCategories();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? "other");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const userTouchedCategory = useRef(false);
  const [suggestion, setSuggestion] = useState<{ category: string; source: string } | null>(null);

  // Keep selected category valid when list loads/changes
  useEffect(() => {
    if (categories.length === 0) return;
    if (!categories.some((c) => c.slug === category)) {
      setCategory(categories[0].slug);
    }
  }, [categories, category]);

  useEffect(() => {
    const s = suggestCategory(note, overrides);
    setSuggestion(s.source === "default" ? null : { category: s.category, source: s.source });
    if (!userTouchedCategory.current && s.source !== "default" && categories.some((c) => c.slug === s.category)) {
      setCategory(s.category);
    }
  }, [note, overrides, categories]);

  const pickCategory = (id: string) => {
    setCategory(id);
    userTouchedCategory.current = true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      amount: parseFloat(amount),
      category,
      note: note.trim() || undefined,
      spent_at: date,
    });
    if (!parsed.success) {
      toast.error(t("invalid_amount"));
      return;
    }
    setBusy(true);
    try {
      await onAdd({
        amount: parsed.data.amount,
        category: parsed.data.category,
        note: parsed.data.note,
        spent_at: toLocalDateString(parsed.data.spent_at),
      });

      // Learn from the user's choice if they had a note.
      // We only learn when the chosen category differs from what the keyword rules
      // would have suggested (i.e. it's a real correction or a user-confirmed override).
      if (parsed.data.note) {
        const builtIn = suggestCategory(parsed.data.note, {});
        const shouldLearn =
          userTouchedCategory.current ||
          builtIn.category !== parsed.data.category ||
          builtIn.source === "default";
        if (shouldLearn) {
          remember(parsed.data.note, parsed.data.category);
        }
      }

      setAmount("");
      setNote("");
      setDate(new Date());
      userTouchedCategory.current = false;
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 520);
      toast.success(t("logged"));
    } catch {
      toast.error(t("save_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative overflow-hidden bg-card rounded-3xl shadow-card p-6 md:p-8 border border-border transition-smooth",
        justAdded && "expense-pop border-primary/30 shadow-glow",
      )}
    >
      <div className="pointer-events-none absolute inset-0 expense-shimmer opacity-0" aria-hidden />
      <h2 className="font-display text-2xl mb-5">{t("quick_add")}</h2>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="font-display text-4xl text-muted-foreground">$</span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border-0 border-b-2 border-border rounded-none px-0 font-display text-5xl h-auto py-1 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
          autoFocus
        />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("category")}</p>
          {suggestion && !userTouchedCategory.current && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Sparkles className="h-3 w-3" />
              {t("auto_detected")}: {getCategory(suggestion.category).icon} {getCategory(suggestion.category).name}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCategory(c.slug)}
              className={cn(
                "px-3 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border hover:-translate-y-0.5 active:scale-95",
                category === c.slug
                  ? "bg-primary text-primary-foreground border-primary shadow-glow scale-[1.03]"
                  : "bg-secondary border-transparent hover:border-border hover:bg-muted"
              )}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("date")}</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal rounded-xl bg-secondary border-transparent hover:bg-secondary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              disabled={(d) => d > new Date()}
              initialFocus
              locale={dateLocale}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Input
        placeholder={t("optional_note")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={140}
          className="rounded-xl bg-secondary border-transparent mb-5 transition-smooth focus-visible:-translate-y-0.5 focus-visible:shadow-card"
      />

      <Button
        type="submit"
        disabled={busy || !amount}
        className="w-full rounded-xl h-12 bg-gradient-primary hover:opacity-95 transition-smooth shadow-glow text-base cta-add"
      >
        <Plus className={cn("mr-1 h-5 w-5 transition-transform", busy && "animate-spin")} />
        {busy ? t("saving") : t("add_expense")}
      </Button>
    </form>
  );
};
