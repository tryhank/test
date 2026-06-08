import { useMemo } from "react";

import { type Locale, I18nContext, getMessages } from "@/lib/i18n";

type I18nProviderProps = {
  locale: Locale;
  children: React.ReactNode;
};

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      messages: getMessages(locale),
    }),
    [locale],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
