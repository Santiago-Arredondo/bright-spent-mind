import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
}

interface Ctx {
  categories: Category[];
  loading: boolean;
  getCategory: (slug: string) => Category;
  createCategory: (input: { name: string; color: string; icon: string }) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<{ name: string; color: string; icon: string }>) => Promise<void>;
  deleteCategory: (id: string, opts?: { reassignTo?: string }) => Promise<void>;
  reload: () => Promise<void>;
}

const FALLBACK: Omit<Category, "slug"> = {
  id: "__unknown",
  name: "—",
  color: "220 15% 55%",
  icon: "✨",
  sort_order: 999,
};

const CategoriesContext = createContext<Ctx | undefined>(undefined);

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `cat-${Date.now().toString(36)}`;

export const CategoriesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name, color, icon, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setCategories((data as Category[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const getCategory = useCallback(
    (slug: string): Category => {
      const found = categories.find((c) => c.slug === slug);
      if (found) return found;
      return { ...FALLBACK, slug, id: slug } as Category;
    },
    [categories]
  );

  const createCategory: Ctx["createCategory"] = async ({ name, color, icon }) => {
    if (!userId) throw new Error("not_authenticated");
    const base = slugify(name);
    let slug = base;
    let i = 2;
    const existing = new Set(categories.map((c) => c.slug));
    while (existing.has(slug)) slug = `${base}-${i++}`;
    const nextOrder = (categories.at(-1)?.sort_order ?? 0) + 1;
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, slug, name, color, icon, sort_order: nextOrder })
      .select("id, slug, name, color, icon, sort_order")
      .single();
    if (error) throw error;
    const next = data as Category;
    setCategories((prev) => [...prev, next].sort((a, b) => a.sort_order - b.sort_order));
    return next;
  };

  const updateCategory: Ctx["updateCategory"] = async (id, patch) => {
    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select("id, slug, name, color, icon, sort_order")
      .single();
    if (error) throw error;
    const next = data as Category;
    setCategories((prev) => prev.map((c) => (c.id === id ? next : c)));
  };

  const deleteCategory: Ctx["deleteCategory"] = async (id, opts) => {
    if (!userId) throw new Error("not_authenticated");
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if (opts?.reassignTo) {
      const target = categories.find((c) => c.id === opts.reassignTo);
      if (!target) throw new Error("invalid_target");
      const { error: e1 } = await supabase
        .from("expenses")
        .update({ category: target.slug })
        .eq("user_id", userId)
        .eq("category", cat.slug);
      if (e1) throw e1;
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const value = useMemo<Ctx>(
    () => ({ categories, loading, getCategory, createCategory, updateCategory, deleteCategory, reload: load }),
    [categories, loading, getCategory, load]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
};
