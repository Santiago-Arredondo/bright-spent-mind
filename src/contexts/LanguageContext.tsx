import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Lang, t as translate, TKey } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

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
  const { user } = useAuth();
  const [lang, setLangState] = useState<Lang>(getInitial);
  const hydratedFor = useRef<string | null>(null);

  // Persist locally + reflect on <html lang>
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Load preferred_language from profile when user signs in (once per user)
  useEffect(() => {
    if (!user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.id) return;
    hydratedFor.current = user.id;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();
      const pl = data?.preferred_language;
      if (pl === "es" || pl === "en") setLangState(pl);
    })();
  }, [user]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (user) {
        supabase
          .from("profiles")
          .update({ preferred_language: l })
          .eq("id", user.id)
          .then(() => {});
      }
    },
    [user]
  );

  const t = useCallback((key: TKey) => translate(key, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
