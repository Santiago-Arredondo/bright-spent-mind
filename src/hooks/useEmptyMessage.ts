import { useEffect, useState } from "react";
import { readTone, TONE_CHANGE_EVENT, TONE_KEY, type Tone } from "@/lib/tone";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEmptyMessage, type EmptyKey } from "@/lib/emptyMessages";

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
    const onToneChange = () => setTone(readTone());
    const onFocus = () => setTone(readTone());
    window.addEventListener("storage", onStorage);
    window.addEventListener(TONE_CHANGE_EVENT, onToneChange);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TONE_CHANGE_EVENT, onToneChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return getEmptyMessage(key, tone, lang);
};
