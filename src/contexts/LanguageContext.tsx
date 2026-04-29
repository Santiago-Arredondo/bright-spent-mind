import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Lang, t as translate, TKey } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

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
  const [userId, setUserId] = useState<string | null>(null);
  const hydratedFor = useRef<string | null>(null);

  // Persist locally + reflect on <html lang>
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Track auth user directly (decoupled from AuthContext to avoid provider-order issues)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Hydrate language from profile when user signs in (once per user)
  useEffect(() => {
    if (!userId) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", userId)
        .maybeSingle();
      const pl = data?.preferred_language;
      if (pl === "es" || pl === "en") setLangState(pl);
    })();
  }, [userId]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (userId) {
        supabase
          .from("profiles")
          .update({ preferred_language: l })
          .eq("id", userId)
          .then(() => {});
      }
    },
    [userId]
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
