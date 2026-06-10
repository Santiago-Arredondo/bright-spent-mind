import { useCallback, useMemo, useState } from "react";

/**
 * Generic multi-select state. Items are tracked by composite string id
 * (e.g. "expense:<uuid>" / "income:<uuid>") so a single hook can manage
 * mixed transaction lists.
 */
export const useBulkSelection = () => {
  const [mode, setMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const enter = useCallback(() => setMode(true), []);
  const exit = useCallback(() => {
    setMode(false);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMode(true);
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
    setMode(true);
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const api = useMemo(
    () => ({ mode, selected, count: selected.size, enter, exit, toggle, selectAll, clear, isSelected }),
    [mode, selected, enter, exit, toggle, selectAll, clear, isSelected]
  );

  return api;
};

export type BulkSelection = ReturnType<typeof useBulkSelection>;
