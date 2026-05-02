import type { Expense } from "@/components/ExpenseList";
import type { Income } from "@/hooks/useIncome";
import { parseLocalDate } from "@/lib/dateOnly";

export type MonthlyTxn =
  | { kind: "expense"; date: string; data: Expense }
  | { kind: "income"; date: string; data: Income };

export interface MonthlyGroup {
  /** YYYY-MM key, e.g. "2026-04" */
  key: string;
  year: number;
  /** 0-indexed month (Jan = 0) */
  month: number;
  /** First day of the month, used for locale formatting */
  date: Date;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: MonthlyTxn[];
}

// Parse a YYYY-MM-DD (or full ISO) string as a LOCAL date — avoids
// the off-by-one-day shift caused by `new Date("2026-05-01")` being UTC.
const parseLocal = (iso: string): Date => {
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const monthKey = (iso: string) => {
  const d = parseLocal(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Groups expenses + income by month/year.
 * Returns most-recent month first.
 */
export const buildMonthlyGroups = (
  expenses: Expense[],
  income: Income[]
): MonthlyGroup[] => {
  const map = new Map<string, MonthlyGroup>();

  const ensure = (iso: string) => {
    const key = monthKey(iso);
    let g = map.get(key);
    if (!g) {
      const d = parseLocal(iso);
      g = {
        key,
        year: d.getFullYear(),
        month: d.getMonth(),
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactions: [],
      };
      map.set(key, g);
    }
    return g;
  };

  for (const e of expenses) {
    const g = ensure(e.spent_at);
    g.totalExpenses += Number(e.amount);
    g.transactions.push({ kind: "expense", date: e.spent_at, data: e });
  }
  for (const i of income) {
    const g = ensure(i.received_at);
    g.totalIncome += Number(i.amount);
    g.transactions.push({ kind: "income", date: i.received_at, data: i });
  }

  for (const g of map.values()) {
    g.balance = g.totalIncome - g.totalExpenses;
    g.transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
};
