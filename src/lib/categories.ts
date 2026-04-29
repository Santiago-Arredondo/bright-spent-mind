export type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string; // hsl values for chart
};

export const CATEGORIES: Category[] = [
  { id: "food", label: "Food", emoji: "🍜", color: "18 78% 62%" },
  { id: "transport", label: "Transport", emoji: "🚇", color: "200 70% 55%" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "340 70% 60%" },
  { id: "bills", label: "Bills", emoji: "🧾", color: "260 50% 60%" },
  { id: "fun", label: "Fun", emoji: "🎉", color: "45 90% 55%" },
  { id: "health", label: "Health", emoji: "🌿", color: "158 50% 45%" },
  { id: "home", label: "Home", emoji: "🏡", color: "25 60% 50%" },
  { id: "other", label: "Other", emoji: "✨", color: "220 15% 55%" },
];

export const getCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
