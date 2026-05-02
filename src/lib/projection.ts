import type { Expense } from "@/components/ExpenseList";
import { isSameMonth } from "@/lib/dateFormat";

export interface MonthProjection {
  monthTotal: number;
  dailyAvg: number;
  daysInMonth: number;
  daysSoFar: number;
  projectedTotal: number;
  remaining: number;
  hasData: boolean;
}

/**
 * Simple linear projection of end-of-month spending based on
 * average daily spending so far this month.
 */
export const projectMonthSpending = (expenses: Expense[], now: Date = new Date()): MonthProjection => {
  const year = now.getFullYear();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const daysSoFar = now.getDate();

  let monthTotal = 0;
  for (const e of expenses) {
    if (isSameMonth(e.spent_at, now)) {
      monthTotal += Number(e.amount) || 0;
    }
  }

  const dailyAvg = daysSoFar > 0 ? monthTotal / daysSoFar : 0;
  const projectedTotal = dailyAvg * daysInMonth;

  return {
    monthTotal,
    dailyAvg,
    daysInMonth,
    daysSoFar,
    projectedTotal,
    remaining: Math.max(0, projectedTotal - monthTotal),
    hasData: monthTotal > 0,
  };
};
