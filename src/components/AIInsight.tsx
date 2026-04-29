import { useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Expense } from "./ExpenseList";

interface Props {
  expenses: Expense[];
}

export type Tone = "soft" | "neutral" | "brutal";
const TONE_KEY = "coin.tone";
const getInitialTone = (): Tone => {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(TONE_KEY);
  return v === "soft" || v === "neutral" || v === "brutal" ? v : "neutral";
};

export const AIInsight = ({ expenses }: Props) => {
  const { t, lang } = useLanguage();
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [tone, setToneState] = useState<Tone>(getInitialTone);
  // Keep last few insights to send back so the model picks a different angle
  const recentRef = useRef<string[]>([]);

  const setTone = (next: Tone) => {
    setToneState(next);
    try {
      localStorage.setItem(TONE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const fetchInsight = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("insights", {
        body: {
          expenses: expenses.slice(0, 50),
          lang,
          tone,
          previous_insights: recentRef.current,
        },
      });
      if (error) throw error;
      if (data?.error) {
        setError(data.error);
      } else {
        const next: string = data?.insight ?? "";
        setInsight(next);
        if (next) {
          recentRef.current = [next, ...recentRef.current.filter((r) => r !== next)].slice(0, 5);
        }
      }
    } catch (e) {
      setError(t("ai_error"));
    } finally {
      setLoading(false);
    }
  };

  // refetch when language or tone changes (and on initial load with expenses)
  useEffect(() => {
    if (expenses.length > 0) fetchInsight();
    else setInsight("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, tone, expenses.length > 0]);

  const toneLabel: Record<Tone, string> = {
    soft: t("tone_soft"),
    neutral: t("tone_neutral"),
    brutal: t("tone_brutal"),
  };
  const toneDesc: Record<Tone, string> = {
    soft: t("tone_soft_desc"),
    neutral: t("tone_neutral_desc"),
    brutal: t("tone_brutal_desc"),
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-primary text-primary-foreground shadow-glow">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wider opacity-80">{t("smart_insight")}</p>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-full"
                  aria-label={t("tone")}
                >
                  {toneLabel[tone]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-56">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("tone")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["soft", "neutral", "brutal"] as Tone[]).map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setTone(opt)}
                    className="cursor-pointer flex items-start gap-2 py-2"
                  >
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${tone === opt ? "opacity-100" : "opacity-0"}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{toneLabel[opt]}</span>
                      <span className="text-xs text-muted-foreground">{toneDesc[opt]}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
