// Defaults used as fallback only — the live category list comes from
// CategoriesContext (user-specific, stored in Supabase). Slugs here must
// match those seeded for new users in the DB so the auto-categorizer works.

export type DefaultCategory = {
  slug: string;
  name: string;
  icon: string;
  color: string;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { slug: "food", name: "Food", icon: "🍜", color: "18 78% 62%" },
  { slug: "transport", name: "Transport", icon: "🚇", color: "200 70% 55%" },
  { slug: "shopping", name: "Shopping", icon: "🛍️", color: "340 70% 60%" },
  { slug: "bills", name: "Bills", icon: "🧾", color: "260 50% 60%" },
  { slug: "fun", name: "Fun", icon: "🎉", color: "45 90% 55%" },
  { slug: "health", name: "Health", icon: "🌿", color: "158 50% 45%" },
  { slug: "home", name: "Home", icon: "🏡", color: "25 60% 50%" },
  { slug: "other", name: "Other", icon: "✨", color: "220 15% 55%" },
];

export const PALETTE: string[] = [
  "18 78% 62%",
  "200 70% 55%",
  "340 70% 60%",
  "260 50% 60%",
  "45 90% 55%",
  "158 50% 45%",
  "25 60% 50%",
  "220 15% 55%",
  "0 75% 60%",
  "120 50% 50%",
  "280 60% 60%",
  "190 80% 45%",
];

export const ICON_CHOICES: string[] = [
  "🍜", "🛒", "🚇", "✈️", "🛍️", "🧾", "🎉", "🎮",
  "🌿", "💊", "🏡", "🏠", "📚", "💼", "💰", "💳",
  "🎵", "🎬", "⚽", "🏋️", "✨", "☕", "🍷", "🐾",
];
