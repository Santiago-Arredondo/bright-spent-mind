import type { TKey } from "./i18n";

export type Category = {
  id: string;
  labelKey: TKey;
  emoji: string;
  color: string; // hsl values for chart
};

export const CATEGORIES: Category[] = [
  { id: "food", labelKey: "cat_food", emoji: "🍜", color: "18 78% 62%" },
  { id: "transport", labelKey: "cat_transport", emoji: "🚇", color: "200 70% 55%" },
  { id: "shopping", labelKey: "cat_shopping", emoji: "🛍️", color: "340 70% 60%" },
  { id: "bills", labelKey: "cat_bills", emoji: "🧾", color: "260 50% 60%" },
  { id: "fun", labelKey: "cat_fun", emoji: "🎉", color: "45 90% 55%" },
  { id: "health", labelKey: "cat_health", emoji: "🌿", color: "158 50% 45%" },
  { id: "home", labelKey: "cat_home", emoji: "🏡", color: "25 60% 50%" },
  { id: "other", labelKey: "cat_other", emoji: "✨", color: "220 15% 55%" },
];

export const getCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
