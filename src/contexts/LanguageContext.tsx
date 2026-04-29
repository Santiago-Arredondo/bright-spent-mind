import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Lang, t as translate, TKey } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LanguageContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "coin.lang";

const getInitial = (): Lang => {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "en") return saved;
  return "es";
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback((key: TKey) => translate(key, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
