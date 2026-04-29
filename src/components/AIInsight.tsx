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
const CACHE_KEY = "coin.aiInsight.cache.v1";

const getInitialTone = (): Tone => {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(TONE_KEY);
  return v === "soft" || v === "neutral" || v === "brutal" ? v : "neutral";
};

// ---- Cache types & helpers ----
interface CacheShape {
  insight: string;
  fingerprint: string;
  date: string; // YYYY-MM-DD
  lang: string;
  tone: Tone;
  recent: string[];
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Fingerprint represents the "shape" of spending. Small additions don't
 * trigger a refresh; meaningful changes (significant total delta, new top
 * category, big jump in entries) do.
 */
const buildFingerprint = (expenses: Expense[]): string => {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  let monthTotal = 0;
  let entries = 0;
  const byCat: Record<string, number> = {};
  for (const e of expenses) {
    const d = new Date(e.spent_at);
    if (d.getMonth() === m && d.getFullYear() === y) {
      const amt = Number(e.amount) || 0;
      monthTotal += amt;
      entries += 1;
      byCat[e.category] = (byCat[e.category] || 0) + amt;
    }
  }
  const topCat =
    Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
  // Bucket the total to ~10% steps so tiny additions don't invalidate.
  const totalBucket = Math.round(monthTotal / Math.max(20, monthTotal * 0.1));
  // Bucket entries every 3 to absorb single-add noise.
  const entriesBucket = Math.floor(entries / 3);
  return `${y}-${m}|${totalBucket}|${entriesBucket}|${topCat}`;
};

const readCache = (): CacheShape | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.insight === "string" && typeof parsed?.fingerprint === "string") {
      return parsed as CacheShape;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const writeCache = (c: CacheShape) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
};

export const AIInsight = ({ expenses }: Props) => {
  const { t, lang } = useLanguage();
  const [insight, setInsight] = useState<string>(() => readCache()?.insight ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [tone, setToneState] = useState<Tone>(getInitialTone);
  const recentRef = useRef<string[]>(readCache()?.recent ?? []);

  const setTone = (next: Tone) => {
    setToneState(next);
    try {
      localStorage.setItem(TONE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const fetchInsight = async (opts: { force?: boolean } = {}) => {
    const fingerprint = buildFingerprint(expenses);
    const cached = readCache();

    // Cache hit: same day, same lang/tone, same fingerprint → reuse, no API call.
    if (
      !opts.force &&
      cached &&
      cached.insight &&
      cached.date === todayStr() &&
      cached.lang === lang &&
      cached.tone === tone &&
      cached.fingerprint === fingerprint
    ) {
      setInsight(cached.insight);
      recentRef.current = cached.recent ?? [];
      return;
    }

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
          writeCache({
            insight: next,
            fingerprint,
            date: todayStr(),
            lang,
            tone,
            recent: recentRef.current,
          });
        }
      }
    } catch (e) {
      setError(t("ai_error"));
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh only when truly needed (new day, lang/tone change, or
  // significant data shift). Identical state → cached result, zero API calls.
  useEffect(() => {
    if (expenses.length === 0) {
      setInsight("");
      return;
    }
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, tone, buildFingerprint(expenses)]);

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
              onClick={() => fetchInsight({ force: true })}
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
