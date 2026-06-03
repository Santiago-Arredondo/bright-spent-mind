import type { Expense } from "@/components/ExpenseList";
import type { Income } from "@/hooks/useIncome";
import type { Category } from "@/contexts/CategoriesContext";
import { INCOME_SOURCES, getIncomeSource } from "@/lib/incomeSources";
import { t as tt, type Lang } from "@/lib/i18n";

export type TxnKind = "expense" | "income";

export type SearchItem =
  | { kind: "expense"; date: string; amount: number; data: Expense }
  | { kind: "income"; date: string; amount: number; data: Income };

export const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const categoryNameBySlug = (cats: Category[]) => {
  const m = new Map<string, string>();
  for (const c of cats) m.set(c.slug, c.name);
  return m;
};

const sourceLabelById = (lang: Lang) => {
  const m = new Map<string, string>();
  for (const s of INCOME_SOURCES) m.set(s.id, tt(s.labelKey, lang));
  return m;
};

export interface SearchFilters {
  query: string;
  type: "all" | "expense" | "income";
  /** category slug (expenses only) */
  category: string | null;
  from?: Date;
  to?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export const filterTransactions = (
  expenses: Expense[],
  income: Income[],
  filters: SearchFilters,
  cats: Category[],
  lang: Lang
): SearchItem[] => {
  const q = normalize(filters.query.trim());
  const catMap = categoryNameBySlug(cats);
  const srcMap = sourceLabelById(lang);
  const list: SearchItem[] = [];

  const matches = (haystacks: string[], amount: number): boolean => {
    if (!q) return true;
    if (haystacks.some((h) => h && normalize(h).includes(q))) return true;
    // amount substring match (digits only on both sides)
    const qDigits = q.replace(/\D/g, "");
    if (qDigits && String(Math.round(amount)).includes(qDigits)) return true;
    return false;
  };

  const inDate = (iso: string): boolean => {
    if (!filters.from && !filters.to) return true;
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    if (filters.from && dt < filters.from) return false;
    if (filters.to && dt > filters.to) return false;
    return true;
  };

  const inAmount = (n: number): boolean => {
    if (filters.minAmount != null && n < filters.minAmount) return false;
    if (filters.maxAmount != null && n > filters.maxAmount) return false;
    return true;
  };

  if (filters.type !== "income") {
    for (const e of expenses) {
      if (filters.category && e.category !== filters.category) continue;
      if (!inDate(e.spent_at)) continue;
      if (!inAmount(Number(e.amount))) continue;
      const catName = catMap.get(e.category) || e.category;
      if (!matches([e.note || "", catName, e.category], Number(e.amount))) continue;
      list.push({ kind: "expense", date: e.spent_at, amount: Number(e.amount), data: e });
    }
  }
  if (filters.type !== "expense") {
    for (const i of income) {
      if (filters.category) continue;
      if (!inDate(i.received_at)) continue;
      if (!inAmount(Number(i.amount))) continue;
      const srcName = srcMap.get(i.source) || i.source;
      if (!matches([i.description || "", srcName, i.source], Number(i.amount))) continue;
      list.push({ kind: "income", date: i.received_at, amount: Number(i.amount), data: i });
    }
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export interface SearchSummary {
  count: number;
  totalExpenses: number;
  totalIncome: number;
  avgExpense: number;
  avgIncome: number;
  topCategory: { slug: string; name: string; icon: string; total: number } | null;
}

export const summarize = (items: SearchItem[], cats: Category[]): SearchSummary => {
  let totalExpenses = 0;
  let totalIncome = 0;
  let nExp = 0;
  let nInc = 0;
  const byCat = new Map<string, number>();
  for (const it of items) {
    if (it.kind === "expense") {
      totalExpenses += it.amount;
      nExp += 1;
      byCat.set(it.data.category, (byCat.get(it.data.category) || 0) + it.amount);
    } else {
      totalIncome += it.amount;
      nInc += 1;
    }
  }
  let topCategory: SearchSummary["topCategory"] = null;
  let topTotal = -1;
  for (const [slug, total] of byCat) {
    if (total > topTotal) {
      const c = cats.find((x) => x.slug === slug);
      topCategory = {
        slug,
        name: c?.name || slug,
        icon: c?.icon || "✨",
        total,
      };
      topTotal = total;
    }
  }
  return {
    count: items.length,
    totalExpenses,
    totalIncome,
    avgExpense: nExp ? totalExpenses / nExp : 0,
    avgIncome: nInc ? totalIncome / nInc : 0,
    topCategory,
  };
};

/** Split text into segments marking matches of `query` (case/diacritic-insensitive). */
export const highlightSegments = (text: string, query: string): Array<{ text: string; match: boolean }> => {
  const q = query.trim();
  if (!q || !text) return [{ text: text || "", match: false }];
  const nText = normalize(text);
  const nQuery = normalize(q);
  if (!nQuery) return [{ text, match: false }];
  const out: Array<{ text: string; match: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const idx = nText.indexOf(nQuery, i);
    if (idx === -1) {
      out.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) out.push({ text: text.slice(i, idx), match: false });
    out.push({ text: text.slice(idx, idx + nQuery.length), match: true });
    i = idx + nQuery.length;
  }
  return out;
};

export { getIncomeSource };
