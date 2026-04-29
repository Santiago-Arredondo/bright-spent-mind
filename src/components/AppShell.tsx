import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sparkles, History as HistoryIcon, Plus, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "./LanguageToggle";

interface Props {
  children: React.ReactNode;
  onAddClick: () => void;
}

export const AppShell = ({ children, onAddClick }: Props) => {
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
    { to: "/history", label: t("nav_history"), icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-warm pb-24 md:pb-0">
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">Coin</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-card/60 backdrop-blur border border-border rounded-full p-1 shadow-card">
          {navItems.map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-2",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
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
            className="hidden md:inline-flex rounded-full bg-gradient-primary hover:opacity-90 shadow-glow"
          >
            <Plus className="h-4 w-4" />
            {t("add_expense")}
          </Button>
        </div>
      </header>

      <main>{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-around relative px-4 py-2">
          {navItems.slice(0, 1).map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </NavLink>
            );
          })}
          <button
            onClick={onAddClick}
            className="-mt-8 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center"
            aria-label={t("add_expense")}
          >
            <Plus className="h-6 w-6" />
          </button>
          {navItems.slice(1).map((n) => {
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
