import { RiGlobalLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, locales, setStoredLocale, useLocale } from "@/lib/i18n";

const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export function LanguageSwitcher({
  onLocaleChange,
}: {
  onLocaleChange?: (locale: Locale) => void;
}) {
  const currentLocale = useLocale();

  function switchLocale(newLocale: Locale) {
    if (newLocale === currentLocale) return;
    setStoredLocale(newLocale);
    onLocaleChange?.(newLocale);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <RiGlobalLine className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Switch language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuCheckboxItem
            key={loc}
            checked={loc === currentLocale}
            onCheckedChange={(v) => v && switchLocale(loc)}
          >
            {localeLabels[loc]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
