export type Tone = "soft" | "neutral" | "brutal";

export const TONE_KEY = "coin.tone";

export const readTone = (): Tone => {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(TONE_KEY);
  return v === "soft" || v === "neutral" || v === "brutal" ? v : "neutral";
};
