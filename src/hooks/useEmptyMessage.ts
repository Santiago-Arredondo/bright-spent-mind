import { useEffect, useState } from "react";
import type { Tone } from "@/components/AIInsight";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEmptyMessage, type EmptyKey } from "@/lib/emptyMessages";

const TONE_KEY = "coin.tone";

const readTone = (): Tone => {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(TONE_KEY);
  return v === "soft" || v === "neutral" || v === "brutal" ? v : "neutral";
};

/**
 * Returns a tone- and language-aware empty-state message.
 * Reactively updates when the tone changes in another component (storage event)
 * or when the language switches.
 */
export const useEmptyMessage = (key: EmptyKey): string => {
  const { lang } = useLanguage();
  const [tone, setTone] = useState<Tone>(readTone);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TONE_KEY) setTone(readTone());
    };
    const onFocus = () => setTone(readTone());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return getEmptyMessage(key, tone, lang);
};
