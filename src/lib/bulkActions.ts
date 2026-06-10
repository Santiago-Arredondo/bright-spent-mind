import type { LucideIcon } from "lucide-react";
import type { TKey } from "@/lib/i18n";

/**
 * Registry-friendly bulk action definition. New bulk actions (recategorize,
 * tag, export, …) can be added by pushing entries with the same shape.
 */
export interface BulkAction {
  id: "delete" | "recategorize" | "tag" | "export";
  labelKey: TKey;
  icon: LucideIcon;
  destructive?: boolean;
  /** Resolves to nothing — the action handles its own confirmation/toasts. */
  run: (ids: { expense: string[]; income: string[] }) => Promise<void> | void;
}

/** Split composite "kind:id" identifiers into per-table id buckets. */
export const splitSelection = (ids: Iterable<string>) => {
  const expense: string[] = [];
  const income: string[] = [];
  for (const raw of ids) {
    const [kind, id] = raw.split(":");
    if (!id) continue;
    if (kind === "expense") expense.push(id);
    else if (kind === "income") income.push(id);
  }
  return { expense, income };
};
