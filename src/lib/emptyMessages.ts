import type { Lang } from "./i18n";
import type { Tone } from "@/components/AIInsight";

export type EmptyKey =
  | "list"        // No expenses logged at all
  | "insight"     // AI insight has nothing to say yet
  | "leak"        // Biggest money leak — no data
  | "projection"  // Spending projection — no data
  | "breakdown"   // Category breakdown — no data
  | "trend"       // Monthly trend — no data
  | "notifications"; // Notification center — no alerts

type Bank = Record<EmptyKey, Record<Tone, Record<Lang, string[]>>>;

/**
 * Empty state copy with personality. Each (context × tone × language) has a
 * small bank of variants; we pick one pseudo-randomly so the app doesn't feel
 * like it's repeating itself.
 */
export const EMPTY_MESSAGES: Bank = {
  list: {
    soft: {
      es: [
        "Aún no hay datos. Empecemos simple.",
        "Tu historia financiera está en blanco. Sin prisa.",
        "Cuando agregues tu primer gasto, lo cuidaremos aquí.",
      ],
      en: [
        "No data yet. Let’s start simple.",
        "A blank page is a good place to begin.",
        "Add your first expense whenever you’re ready.",
      ],
    },
    neutral: {
      es: [
        "Registra tu primer gasto para ver tus patrones.",
        "Empieza con un gasto. El resto se construye solo.",
        "Sin movimientos todavía. Agrega uno para comenzar.",
      ],
      en: [
        "Add your first expense to see patterns.",
        "Start with one entry. The rest follows.",
        "No movements yet — log one to get going.",
      ],
    },
    brutal: {
      es: [
        "Sin datos no hay historia. Empieza ya.",
        "Cero gastos, cero análisis. Ya sabes qué hacer.",
        "Esto no se llena solo. Agrega un gasto.",
      ],
      en: [
        "No data, no story. Start now.",
        "Zero expenses, zero insight. Your move.",
        "This won’t fill itself. Log something.",
      ],
    },
  },
  insight: {
    soft: {
      es: [
        "Aún no tengo nada que decirte. Y está bien.",
        "Cuéntame en qué gastas y empezamos a leerlo juntos.",
      ],
      en: [
        "Nothing to say yet — and that’s fine.",
        "Show me a few expenses and we’ll read them together.",
      ],
    },
    neutral: {
      es: [
        "Registra algunos gastos y notaré patrones.",
        "Necesito datos para encontrar señales.",
      ],
      en: [
        "Log a few expenses and I’ll spot patterns.",
        "I need some data before I can read signals.",
      ],
    },
    brutal: {
      es: [
        "No puedo analizar el aire. Agrega gastos.",
        "Sin movimientos, no hay diagnóstico.",
      ],
      en: [
        "Can’t analyze thin air. Log something.",
        "No transactions, no diagnosis.",
      ],
    },
  },
  leak: {
    soft: {
      es: [
        "Aún no veo fugas. Eso es buena señal.",
        "Cuando haya gastos, te muestro a dónde se va más.",
      ],
      en: [
        "No leaks to show yet — that’s a good sign.",
        "Once expenses come in, I’ll point to where most goes.",
      ],
    },
    neutral: {
      es: [
        "Registra gastos para descubrir tu mayor fuga.",
        "Sin datos no se puede medir dónde se concentra el gasto.",
      ],
      en: [
        "Log expenses to spot your biggest leak.",
        "Without data, there’s no top category to highlight.",
      ],
    },
    brutal: {
      es: [
        "¿Dónde se va tu dinero? Aún no lo sé. Empieza a registrar.",
        "Sin gastos, sin culpables. Tu turno.",
      ],
      en: [
        "Where’s your money going? No clue yet. Start logging.",
        "No expenses, no suspects. Your move.",
      ],
    },
  },
  projection: {
    soft: {
      es: [
        "Aún no puedo proyectar. Empecemos con un gasto.",
        "Pronto verás hacia dónde apuntas este mes.",
      ],
      en: [
        "Nothing to project yet. Let’s start with one expense.",
        "Soon you’ll see where the month is heading.",
      ],
    },
    neutral: {
      es: [
        "Registra un gasto para ver tu proyección.",
        "Necesito al menos un movimiento para estimar el mes.",
      ],
      en: [
        "Log an expense to see your projection.",
        "I need at least one entry to estimate the month.",
      ],
    },
    brutal: {
      es: [
        "Sin gastos no hay proyección. Obvio.",
        "Cero datos, cero futuro estimado. Empieza.",
      ],
      en: [
        "No expenses, no projection. Obviously.",
        "Zero data, zero forecast. Start.",
      ],
    },
  },
  breakdown: {
    soft: {
      es: [
        "El desglose aparecerá en cuanto registres algo.",
        "Aquí veremos cómo se reparte tu mes.",
      ],
      en: [
        "A breakdown appears as soon as you log something.",
        "This is where your month splits into pieces.",
      ],
    },
    neutral: {
      es: [
        "El desglose aparecerá cuando registres gastos.",
        "Agrega gastos para ver la distribución por categoría.",
      ],
      en: [
        "A breakdown will appear once you log expenses.",
        "Add expenses to see the category split.",
      ],
    },
    brutal: {
      es: [
        "Nada que dividir todavía. Empieza a gastar… o a registrar.",
        "Sin movimientos, no hay categorías. Punto.",
      ],
      en: [
        "Nothing to slice yet. Start logging.",
        "No movements, no categories. Period.",
      ],
    },
  },
  trend: {
    soft: {
      es: [
        "Tu tendencia se dibujará con el tiempo.",
        "Aún sin curva — pronto la veremos juntos.",
      ],
      en: [
        "Your trend will draw itself over time.",
        "No curve yet — we’ll watch it grow.",
      ],
    },
    neutral: {
      es: [
        "Agrega gastos para ver tu tendencia.",
        "Sin datos no hay línea que seguir.",
      ],
      en: [
        "Add expenses to see your trend.",
        "No data, no line to follow.",
      ],
    },
    brutal: {
      es: [
        "Sin gastos, sin gráfico. Así de simple.",
        "Tu tendencia es plana porque no hay nada. Cambia eso.",
      ],
      en: [
        "No expenses, no chart. Simple.",
        "Your trend is flat because there’s nothing. Fix that.",
      ],
    },
  },
  notifications: {
    soft: {
      es: [
        "Sin avisos por ahora. Todo en orden.",
        "Silencio sano. Nada que reportar.",
      ],
      en: [
        "No alerts right now. All clear.",
        "Healthy silence. Nothing to report.",
      ],
    },
    neutral: {
      es: [
        "No hay alertas activas.",
        "Todo dentro de lo esperado.",
      ],
      en: [
        "No active alerts.",
        "Everything within expected range.",
      ],
    },
    brutal: {
      es: [
        "Nada que gritarte hoy. Disfrútalo.",
        "Cero alertas. No te acostumbres.",
      ],
      en: [
        "Nothing to yell about today. Enjoy it.",
        "Zero alerts. Don’t get used to it.",
      ],
    },
  },
};

/**
 * Pick a message variant. Uses the day-of-month as a seed so the copy is
 * stable within a session/day but rotates naturally over time, avoiding the
 * "same words every render" feeling.
 */
export const getEmptyMessage = (key: EmptyKey, tone: Tone, lang: Lang): string => {
  const variants = EMPTY_MESSAGES[key]?.[tone]?.[lang] ?? [];
  if (variants.length === 0) return "";
  const seed = new Date().getDate() + key.length;
  return variants[seed % variants.length];
};
