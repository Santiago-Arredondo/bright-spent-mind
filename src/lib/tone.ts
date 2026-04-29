export type Tone = "soft" | "neutral" | "brutal";

export const TONE_KEY = "coin.tone";
export const TONE_CHANGE_EVENT = "coin:tone-change";

export const readTone = (): Tone => {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(TONE_KEY);
  return v === "soft" || v === "neutral" || v === "brutal" ? v : "neutral";
};

export const writeTone = (next: Tone) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TONE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<Tone>(TONE_CHANGE_EVENT, { detail: next }));
};
