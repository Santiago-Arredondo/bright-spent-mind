import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OverrideMap } from "@/lib/categorizer";
import { learnableKeywords } from "@/lib/categorizer";

export const useCategoryOverrides = () => {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setOverrides({});
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("category_overrides")
        .select("keyword, category, hits")
        .eq("user_id", userId);
      const map: OverrideMap = {};
      for (const row of data || []) {
        (map[row.keyword] ||= {})[row.category] = row.hits;
      }
      setOverrides(map);
    })();
  }, [userId]);

  /**
   * Remember that for this note, the user picked `category`.
   * Increments hits for each learnable keyword in the note.
   */
  const remember = useCallback(
    async (note: string, category: string) => {
      if (!userId || !note?.trim()) return;
      const keywords = learnableKeywords(note);
      if (keywords.length === 0) return;

      // Optimistic local update
      setOverrides((prev) => {
        const next = { ...prev };
        for (const kw of keywords) {
          const inner = { ...(next[kw] || {}) };
          inner[category] = (inner[category] || 0) + 1;
          next[kw] = inner;
        }
        return next;
      });

      // Upsert each (keyword, category) pair, incrementing hits
      for (const kw of keywords) {
        const { data: existing } = await supabase
          .from("category_overrides")
          .select("id, hits")
          .eq("user_id", userId)
          .eq("keyword", kw)
          .eq("category", category)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("category_overrides")
            .update({ hits: existing.hits + 1 })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("category_overrides")
            .insert({ user_id: userId, keyword: kw, category, hits: 1 });
        }
      }
    },
    [userId]
  );

  return { overrides, remember };
};
