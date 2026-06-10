# Bulk Transaction Management

A multi-select mode for expenses and income with soft-delete to a Trash bin, restorable for 30 days. Designed so future bulk actions (re-categorize, tag, export) plug in cleanly.

## 1. Database (soft delete)

Add to both `expenses` and `income`:
- `deleted_at timestamptz null` — set on soft delete, null = active
- index on `(user_id, deleted_at)` for fast filtering

RLS policies updated:
- SELECT: only rows where `deleted_at is null` for normal app reads
- A second policy allows the owner to read trashed rows (used by the Trash page)
- UPDATE/DELETE: owner only (already in place)

A scheduled cleanup function (`pg_cron`, daily) hard-deletes any row with `deleted_at < now() - interval '30 days'`. If pg_cron is not desired we can run the purge on app load instead — let me know.

The existing `match_user_transactions` RPC will be updated to skip rows where `deleted_at is not null`.

## 2. Selection architecture

A new shared hook `useBulkSelection<T>()`:
- `selectionMode: boolean`, `enter()`, `exit()`
- `selectedIds: Set<string>`, `toggle(id)`, `selectAll(ids)`, `clear()`
- `isSelected(id)`, `count`

A registry-based `bulkActions` module so future actions plug in:
```ts
type BulkAction<T> = { id: string; labelKey: string; icon; run(ids: string[]): Promise<void>; destructive?: boolean }
```
Initial actions: `delete` (soft). Stubs reserved for `recategorize`, `tag`, `export`.

## 3. UI changes

### Lists (`ExpenseList`, `IncomeList`)
- Long-press (mobile) or a new "Select" button (desktop) enters selection mode
- Each row gains a leading `Checkbox` when mode is active
- Row click toggles selection while mode is active (instead of opening edit)

### Bulk action bar (sticky bottom)
Appears when `selectedIds.size > 0`:
- "N seleccionados / N selected"
- Select all (current filtered view) / Deselect all
- Delete Selected button (destructive)
- Slot for future action buttons

### Confirmation dialog
Reuses `ConfirmDeleteDialog` extended to accept a title/description override:
- "¿Eliminar N registros? Podrás restaurarlos desde la Papelera durante 30 días."
- EN equivalent

### Pages that get selection mode
History, Monthly, Search, Income — all already render `ExpenseList`/`IncomeList`. Selection bar uses the currently displayed (filtered) list as the "select all" target.

## 4. Trash page

New route `/trash` (nav entry with trash icon):
- Tabs: Expenses / Income
- Each row shows original info + "Deleted on …" + days remaining before purge
- Per-row actions: Restore, Delete permanently
- Bulk: Restore all, Empty trash

Restore = `update ... set deleted_at = null`.
Permanent = `delete from ...`.

## 5. Hooks / data layer

- `useExpenses` / `useIncome` queries gain `.is('deleted_at', null)`
- New methods: `softDeleteMany(ids)`, `restoreMany(ids)`, `hardDeleteMany(ids)`
- New hook `useTrash()` loads `deleted_at is not null` rows for both tables
- All mutations update local state optimistically so Dashboard / Monthly / Insights / Balance refresh without reload (they all read from these hooks)

## 6. i18n
Spanish + English strings for: selection count, select all / deselect all, delete selected, confirm dialog, trash page, restore, delete permanently, empty trash, "deleted on", "X days left".

## 7. Out of scope (for now)
- Recategorize / tag / export bulk actions (architecture ready, UI not built)
- Trash auto-purge UI controls
- Undo toast after bulk delete (can add later)

## Files

**New**
- `supabase/migrations/<ts>_soft_delete_trash.sql`
- `src/hooks/useBulkSelection.ts`
- `src/hooks/useTrash.ts`
- `src/lib/bulkActions.ts`
- `src/components/BulkActionBar.tsx`
- `src/pages/Trash.tsx`

**Edited**
- `src/hooks/useExpenses.ts`, `src/hooks/useIncome.ts`
- `src/components/ExpenseList.tsx`, `src/components/IncomeList.tsx`
- `src/components/ConfirmDeleteDialog.tsx` (accept overrides)
- `src/components/AppShell.tsx` (Trash nav link)
- `src/App.tsx` (route)
- `src/pages/History.tsx`, `src/pages/Monthly.tsx`, `src/pages/Search.tsx`, `src/pages/Income.tsx`
- `src/lib/i18n.ts`
- `src/integrations/supabase/types.ts` (auto)
