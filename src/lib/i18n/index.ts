import { createContext, use } from "react";

import en from "@/locales/en";
import zh from "@/locales/zh";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh";

type DeepStringify<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

const messages: Record<Locale, DeepStringify<typeof en>> = { en, zh };
export type Messages = DeepStringify<typeof en>;

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const I18nContext = createContext<{
  locale: Locale;
  messages: Messages;
}>({
  locale: defaultLocale,
  messages: zh,
});

export function useTranslations() {
  const { messages, locale } = use(I18nContext);
  return { t: messages, locale };
}

export function useLocale(): Locale {
  const { locale } = use(I18nContext);
  return locale;
}

const STORAGE_KEY = "locale";
const COOKIE_KEY = "locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY);
  const locale = isValidLocale(stored ?? "") ? (stored as Locale) : defaultLocale;
  // Sync cookie if localStorage has a value but cookie is missing (handles existing users)
  if (stored && !document.cookie.includes(`${COOKIE_KEY}=`)) {
    document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  }
  return locale;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  document.documentElement.lang = locale;
}
