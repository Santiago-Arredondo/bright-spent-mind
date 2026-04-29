import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

export const AIInsight = ({ expenses }: Props) => {
  const { t, lang } = useLanguage();
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchInsight = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("insights", {
        body: { expenses: expenses.slice(0, 50), lang },
      });
      if (error) throw error;
      if (data?.error) {
        setError(data.error);
      } else {
        setInsight(data?.insight ?? "");
      }
    } catch (e) {
      setError(t("ai_error"));
    } finally {
      setLoading(false);
    }
  };

  // refetch when language changes (and on initial load with expenses)
  useEffect(() => {
    if (expenses.length > 0) fetchInsight();
    else setInsight("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, expenses.length > 0]);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-primary text-primary-foreground shadow-glow">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wider opacity-80">{t("ai_insight")}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchInsight}
            disabled={loading || expenses.length === 0}
            className="h-7 w-7 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="font-display text-lg leading-snug min-h-[3.5rem]">
          {loading
            ? t("ai_thinking")
            : error
            ? error
            : insight ||
              (expenses.length === 0 ? t("ai_empty") : t("ai_refresh_hint"))}
        </p>
      </div>
    </div>
  );
};
