import type { TKey } from "./i18n";

export type IncomeSource = {
  id: string;
  labelKey: TKey;
  emoji: string;
};

export const INCOME_SOURCES: IncomeSource[] = [
  { id: "salary", labelKey: "src_salary", emoji: "💼" },
  { id: "freelance", labelKey: "src_freelance", emoji: "🧑‍💻" },
  { id: "business", labelKey: "src_business", emoji: "🏪" },
  { id: "investment", labelKey: "src_investment", emoji: "📈" },
  { id: "gift", labelKey: "src_gift", emoji: "🎁" },
  { id: "other", labelKey: "src_other", emoji: "✨" },
];

export const getIncomeSource = (id: string) =>
  INCOME_SOURCES.find((s) => s.id === id) ?? INCOME_SOURCES[INCOME_SOURCES.length - 1];
