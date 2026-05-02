import { useEffect, useState } from "react";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Expense } from "@/components/ExpenseList";
import { toLocalDateString } from "@/lib/dateOnly";

const schema = z.object({
  amount: z.number().positive().max(1000000000),
  category: z.string().min(1),
  note: z.string().max(140).optional(),
  spent_at: z.date(),
});

interface Props {
  expense: Expense | null;
  onOpenChange: (o: boolean) => void;
  onUpdate: (
    id: string,
    patch: { amount: number; category: string; note?: string; spent_at?: string }
  ) => Promise<void>;
}

export const EditExpenseDialog = ({ expense, onOpenChange, onUpdate }: Props) => {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "es" ? esLocale : undefined;
  const open = !!expense;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setNote(expense.note ?? "");
      setDate(new Date(expense.spent_at));
    }
  }, [expense?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
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
      await onUpdate(expense.id, {
        amount: parsed.data.amount,
        category: parsed.data.category,
        note: parsed.data.note,
        spent_at: toLocalDateString(parsed.data.spent_at),
      });
      toast.success(t("expense_updated"));
      onOpenChange(false);
    } catch {
      toast.error(t("save_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("edit_expense")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="relative overflow-hidden bg-card rounded-3xl shadow-card p-5 sm:p-6 md:p-8 border border-border">
          <h2 className="font-display text-xl sm:text-2xl mb-5">{t("edit_expense")}</h2>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-display text-3xl sm:text-4xl text-muted-foreground">$</span>
            <Input
              type="number" inputMode="decimal" step="0.01" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="border-0 border-b-2 border-border rounded-none px-0 font-display text-4xl sm:text-5xl h-auto py-1 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
              autoFocus
            />
          </div>

          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("category")}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id} type="button" onClick={() => setCategory(c.id)}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border",
                    category === c.id
                      ? "bg-primary text-primary-foreground border-primary shadow-glow scale-[1.03]"
                      : "bg-secondary border-transparent hover:border-border hover:bg-muted"
                  )}
                >
                  <span>{c.emoji}</span>
                  <span>{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("date")}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start text-left font-normal rounded-xl bg-secondary border-transparent hover:bg-secondary">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: dateLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single" selected={date} onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()} initialFocus locale={dateLocale}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Input
            placeholder={t("optional_note")}
            value={note} onChange={(e) => setNote(e.target.value)} maxLength={140}
            className="rounded-xl bg-secondary border-transparent mb-5"
          />

          <Button
            type="submit" disabled={busy || !amount}
            className="w-full rounded-xl h-12 bg-gradient-primary hover:opacity-95 transition-smooth shadow-glow text-base"
          >
            <Plus className={cn("mr-1 h-5 w-5", busy && "animate-spin")} />
            {busy ? t("saving") : t("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
