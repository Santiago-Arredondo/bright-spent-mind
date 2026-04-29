import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import type { Expense } from "./ExpenseList";
import { cn } from "@/lib/utils";

interface Props {
  expenses: Expense[];
}

export const NotificationsBell = ({ expenses }: Props) => {
  const { t } = useLanguage();
  const { notifications, dismiss, dismissAll } = useNotifications(expenses);
  const count = notifications.length;
  const hasAny = count > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notifications")}
          title={t("notifications")}
          className="relative rounded-full text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {hasAny && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary shadow-glow"
            />
          )}
          <span className="sr-only">
            {count} {t("notifications")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-2xl overflow-hidden border-border"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {t("notifications")}
          </p>
          {hasAny && (
            <button
              onClick={dismissAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              {t("notif_dismiss_all")}
            </button>
          )}
        </div>

        <div className={cn("max-h-96 overflow-y-auto", !hasAny && "py-8")}>
          {!hasAny ? (
            <p className="text-center text-sm text-muted-foreground px-6">
              {t("notif_empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="group relative px-4 py-3 hover:bg-muted/40 transition-smooth"
                >
                  <div className="pr-6">
                    <p className="text-sm font-semibold leading-snug mb-0.5">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {n.body}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    aria-label={t("notif_dismiss")}
                    title={t("notif_dismiss")}
                    className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100 focus:opacity-100 transition-smooth"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
