import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-9 px-3 gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Language"
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem
          onClick={() => setLang("es")}
          className={cn("cursor-pointer", lang === "es" && "font-semibold")}
        >
          🇪🇸 Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLang("en")}
          className={cn("cursor-pointer", lang === "en" && "font-semibold")}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
