/// <reference types="vite/client" />
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { useState } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { WebVitals } from "@/components/web-vitals";
import { type Locale, defaultLocale, getStoredLocale, isValidLocale } from "@/lib/i18n";
import { seo } from "@/lib/seo";

import appCss from "@/styles.css?url";

const getServerLocale = createServerFn({ method: "GET" }).handler(() => {
  const cookieLocale = getCookie("locale");
  return cookieLocale && isValidLocale(cookieLocale) ? (cookieLocale as Locale) : defaultLocale;
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  beforeLoad: async () => {
    const serverLocale = await getServerLocale();
    return { serverLocale };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "TanStack Starter",
        description:
          "A minimal TanStack Start template with shadcn/ui, theme switching, and Cloudflare Workers deployment.",
      }),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { serverLocale } = Route.useRouteContext();
  const [locale, setLocale] = useState<Locale>(() =>
    typeof window !== "undefined" ? getStoredLocale() : serverLocale,
  );

  return (
    <RootDocument locale={locale} onLocaleChange={setLocale}>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  locale,
  onLocaleChange,
}: {
  readonly children: React.ReactNode;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <ThemeProvider>
            <div className="flex min-h-svh flex-col">
              <Header onLocaleChange={onLocaleChange} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <WebVitals />
            <Toaster richColors />
          </ThemeProvider>
        </I18nProvider>

        <TanStackDevtools
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />

        <Scripts />
      </body>
    </html>
  );
}
