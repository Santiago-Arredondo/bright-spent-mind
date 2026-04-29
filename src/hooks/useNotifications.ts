import { useCallback, useEffect, useMemo, useState } from "react";
import { computeNotifications, type AppNotification } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { readTone } from "@/lib/tone";
import type { Expense } from "@/components/ExpenseList";

const DISMISS_KEY = "coin.notifs.dismissed";
const MAX_REMEMBERED = 200;

const loadDismissed = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
};

const saveDismissed = (ids: string[]) => {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(ids.slice(-MAX_REMEMBERED)));
  } catch {
    /* ignore quota errors */
  }
};

export const useNotifications = (expenses: Expense[]) => {
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set(loadDismissed()));
  const tone = readTone();

  // Recompute when expenses, language, tone, or dismissed set changes
  const notifications = useMemo<AppNotification[]>(() => {
    const all = computeNotifications(expenses, lang, tone);
    return all.filter((n) => !dismissed.has(n.id));
  }, [expenses, lang, tone, dismissed]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveDismissed(Array.from(next));
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const next = new Set(prev);
      for (const n of computeNotifications(expenses, lang, tone)) next.add(n.id);
      saveDismissed(Array.from(next));
      return next;
    });
  }, [expenses, lang, tone]);

  // Garbage-collect old dismissed ids once a day so the set doesn't grow forever
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSweep = localStorage.getItem("coin.notifs.lastSweep");
    if (lastSweep === today) return;
    localStorage.setItem("coin.notifs.lastSweep", today);
    setDismissed((prev) => {
      // Keep only ids that look "fresh" (current day or stable kind:id)
      const next = new Set(
        Array.from(prev).filter((id) => {
          const tail = id.split(":").pop() ?? "";
          // date-suffixed ids: drop if older than today
          if (/^\d{4}-\d{2}-\d{2}$/.test(tail)) return tail >= today;
          return true; // keep id-suffixed ones (e.g., big_outlier:<expenseId>)
        }),
      );
      saveDismissed(Array.from(next));
      return next;
    });
  }, []);

  return { notifications, dismiss, dismissAll };
};
