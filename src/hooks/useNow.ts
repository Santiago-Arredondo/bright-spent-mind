import { useEffect, useState } from "react";

/**
 * Returns the current Date and updates automatically:
 * - When the day rolls over (scheduled to next midnight)
 * - When the tab becomes visible again (covers sleep / clock changes)
 */
export const useNow = () => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timer: number | undefined;

    const scheduleNext = () => {
      const current = new Date();
      const next = new Date(current);
      next.setHours(24, 0, 0, 50); // just after midnight
      const ms = Math.max(1000, next.getTime() - current.getTime());
      timer = window.setTimeout(() => {
        setNow(new Date());
        scheduleNext();
      }, ms);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };

    scheduleNext();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return now;
};
