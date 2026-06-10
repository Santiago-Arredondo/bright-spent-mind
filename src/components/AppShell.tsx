import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sparkles, History as HistoryIcon, Plus, Wallet, LogOut, TrendingUp, CalendarRange, Tag, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationsBell } from "./NotificationsBell";
import type { Expense } from "./ExpenseList";

interface Props {
  children: React.ReactNode;
  onAddClick: () => void;
  onAddIncomeClick?: () => void;
  expenses: Expense[];
}

export const AppShell = ({ children, onAddClick, onAddIncomeClick, expenses }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const navItems = [
    { to: "/", label: t("nav_dashboard"), icon: LayoutDashboard },
    { to: "/insights", label: t("nav_insights"), icon: Sparkles },
    { to: "/search", label: t("nav_search"), icon: Search },
    { to: "/monthly", label: t("nav_monthly"), icon: CalendarRange },
    { to: "/history", label: t("nav_history"), icon: HistoryIcon },
    { to: "/income", label: t("nav_income"), icon: TrendingUp },
    { to: "/categories", label: t("nav_categories"), icon: Tag },
    { to: "/trash", label: t("nav_trash"), icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-warm pb-28 md:pb-0">
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-4 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg sm:text-xl tracking-tight truncate">
            Flowbit<span className="text-primary">.</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-card/60 backdrop-blur border border-border rounded-full p-1 shadow-card">
          {navItems.map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-2",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <n.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationsBell expenses={expenses} />
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label={t("sign_out")}
            title={t("sign_out")}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={onAddClick}
            size="lg"
            className="cta-add hidden md:inline-flex rounded-full bg-gradient-primary text-primary-foreground font-semibold px-5 h-11 shadow-glow hover:bg-gradient-primary"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            {t("add_expense")}
          </Button>
        </div>
      </header>

      <main>{children}</main>

      {/* Desktop floating action buttons */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 flex-col gap-3">
        {onAddIncomeClick && (
          <button
            onClick={onAddIncomeClick}
            aria-label={t("add_income")}
            title={t("add_income")}
            className="h-12 w-12 rounded-full bg-success text-success-foreground items-center justify-center flex shadow-glow hover:scale-105 transition-smooth"
          >
            <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={onAddClick}
          aria-label={t("add_expense")}
          title={t("add_expense")}
          className="cta-add cta-fab h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-area-pb">
        <div className="flex items-center justify-around relative px-2 py-2">
          {navItems.slice(0, 2).map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 text-[10px] sm:text-xs flex-1 min-w-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate">{n.label}</span>
              </NavLink>
            );
          })}
          <button
            onClick={onAddClick}
            className="cta-add cta-fab -mt-8 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shrink-0"
            aria-label={t("add_expense")}
          >
            <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
          </button>
          {navItems.slice(2).map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 text-[10px] sm:text-xs flex-1 min-w-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate">{n.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
