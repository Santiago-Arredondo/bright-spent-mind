// Keyword-based auto-categorization with user-learned overrides.
// Built-in rules cover common merchants/keywords in EN + ES.

export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "fun"
  | "health"
  | "home"
  | "other";

// Each rule is a list of lowercase substrings that map to a category.
export const KEYWORD_RULES: Record<Exclude<CategoryId, "other">, string[]> = {
  food: [
    "burger", "pizza", "restaurant", "restaurante", "sushi", "taco", "tacos",
    "cafe", "café", "coffee", "starbucks", "mcdonald", "kfc", "subway",
    "comida", "almuerzo", "cena", "desayuno", "panaderia", "panadería",
    "bar", "cerveza", "wine", "vino", "rappi", "ubereats", "uber eats",
    "doordash", "didi food", "grocery", "supermercado", "mercado",
  ],
  transport: [
    "uber", "taxi", "lyft", "didi", "cabify", "bolt", "metro", "subway pass",
    "bus", "autobus", "autobús", "gasolina", "gas", "fuel", "parking",
    "estacionamiento", "toll", "peaje", "train", "tren", "flight", "vuelo",
    "airline", "aerolínea",
  ],
  fun: [
    "netflix", "spotify", "disney", "hbo", "max", "youtube", "apple music",
    "prime video", "cinema", "cine", "movie", "concert", "concierto",
    "game", "juego", "steam", "playstation", "xbox", "twitch",
  ],
  bills: [
    "rent", "renta", "alquiler", "internet", "wifi", "electric", "luz",
    "water", "agua", "phone", "teléfono", "telefono", "celular", "cellular",
    "insurance", "seguro", "tax", "impuesto", "subscription", "suscripción",
  ],
  shopping: [
    "amazon", "mercadolibre", "mercado libre", "shein", "zara", "h&m",
    "nike", "adidas", "shoes", "zapatos", "clothes", "ropa", "store",
    "tienda", "shopping", "compras",
  ],
  health: [
    "pharmacy", "farmacia", "doctor", "médico", "medico", "hospital",
    "clínica", "clinica", "gym", "gimnasio", "yoga", "vitamins", "vitaminas",
    "dental", "dentist", "dentista",
  ],
  home: [
    "ikea", "furniture", "muebles", "home depot", "sodimac", "cleaning",
    "limpieza", "repair", "reparación", "garden", "jardín", "decor",
    "decoración",
  ],
};

export type Suggestion = {
  category: CategoryId;
  source: "override" | "keyword" | "default";
  matchedKeyword?: string;
};

// User-learned overrides: keyword → { category → hits }
export type OverrideMap = Record<string, Record<string, number>>;

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents for matching
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Suggests a category for a free-text note. User overrides win, then keyword rules. */
export const suggestCategory = (
  text: string,
  overrides: OverrideMap = {}
): Suggestion => {
  const note = (text || "").trim();
  if (!note) return { category: "other", source: "default" };

  const tokens = tokenize(note);
  const noteLower = note.toLowerCase();

  // 1. User overrides — pick the keyword with the most hits for any token
  let best: { category: CategoryId; hits: number; keyword: string } | null = null;
  for (const tok of tokens) {
    const map = overrides[tok];
    if (!map) continue;
    for (const [cat, hits] of Object.entries(map)) {
      if (!best || hits > best.hits) {
        best = { category: cat as CategoryId, hits, keyword: tok };
      }
    }
  }
  if (best) {
    return { category: best.category, source: "override", matchedKeyword: best.keyword };
  }

  // 2. Built-in keyword rules
  for (const [cat, keywords] of Object.entries(KEYWORD_RULES) as [
    Exclude<CategoryId, "other">,
    string[]
  ][]) {
    for (const kw of keywords) {
      if (noteLower.includes(kw)) {
        return { category: cat, source: "keyword", matchedKeyword: kw };
      }
    }
  }

  return { category: "other", source: "default" };
};

/** Extracts the keywords from a note that we want to remember a correction for. */
export const learnableKeywords = (text: string): string[] => {
  const tokens = tokenize(text);
  // Skip very short/common words
  const stop = new Set([
    "the", "a", "an", "for", "with", "and", "or", "to", "of", "in", "on",
    "el", "la", "los", "las", "un", "una", "de", "del", "en", "y", "o", "con", "por", "para",
  ]);
  return Array.from(new Set(tokens.filter((t) => t.length >= 3 && !stop.has(t))));
};
