import { useState } from "react";
import { Plus, CalendarIcon, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { INCOME_SOURCES } from "@/lib/incomeSources";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { toLocalDateString } from "@/lib/dateOnly";

const schema = z.object({
  amount: z.number().positive().max(1000000000),
  source: z.string().min(1),
  description: z.string().max(140).optional(),
  received_at: z.date(),
});

interface Props {
  initial?: {
    amount: number;
    source: string;
    description?: string | null;
    received_at?: string;
  };
  submitLabel?: string;
  onSubmit: (e: { amount: number; source: string; description?: string; received_at?: string }) => Promise<void>;
}

export const IncomeForm = ({ initial, submitLabel, onSubmit }: Props) => {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "es" ? esLocale : undefined;

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [source, setSource] = useState(initial?.source ?? "salary");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState<Date>(initial?.received_at ? new Date(initial.received_at) : new Date());
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      amount: parseFloat(amount),
      source,
      description: description.trim() || undefined,
      received_at: date,
    });
    if (!parsed.success) {
      toast.error(t("invalid_amount"));
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        amount: parsed.data.amount,
        source: parsed.data.source,
        description: parsed.data.description,
        received_at: toLocalDateString(parsed.data.received_at),
      });
      if (!initial) {
        setAmount("");
        setDescription("");
        setDate(new Date());
        toast.success(t("income_logged"));
      }
    } catch {
      toast.error(t("save_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden bg-card rounded-3xl shadow-card p-5 sm:p-6 md:p-8 border border-border"
    >
      <h2 className="font-display text-xl sm:text-2xl mb-5 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-success" />
        {initial ? t("edit_income") : t("add_income")}
      </h2>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="font-display text-3xl sm:text-4xl text-muted-foreground">$</span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border-0 border-b-2 border-border rounded-none px-0 font-display text-4xl sm:text-5xl h-auto py-1 focus-visible:ring-0 focus-visible:border-success bg-transparent"
          autoFocus
        />
      </div>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("income_source")}</p>
        <div className="flex flex-wrap gap-2">
          {INCOME_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={cn(
                "px-3 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-1.5 border",
                source === s.id
                  ? "bg-success text-success-foreground border-success shadow-glow scale-[1.03]"
                  : "bg-secondary border-transparent hover:border-border hover:bg-muted"
              )}
            >
              <span>{s.emoji}</span>
              <span>{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("income_date")}</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal rounded-xl bg-secondary border-transparent hover:bg-secondary"
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
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Input
        placeholder={t("income_description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={140}
        className="rounded-xl bg-secondary border-transparent mb-5"
      />

      <Button
        type="submit"
        disabled={busy || !amount}
        className="w-full rounded-xl h-12 bg-success hover:bg-success/90 text-success-foreground transition-smooth shadow-glow text-base"
      >
        <Plus className={cn("mr-1 h-5 w-5", busy && "animate-spin")} />
        {busy ? t("saving") : submitLabel ?? t("add_income")}
      </Button>
    </form>
  );
};
