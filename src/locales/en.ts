export default {
  common: {
    home: "Home",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    goBack: "Go Back",
    tryAgain: "Try Again",
    notFound: "The page you are looking for does not exist.",
  },
  home: {
    title: "TanStack Starter",
    subtitle: "A minimal, production-ready template for building modern web applications.",
    techStack: "React 19 + TanStack Start + Tailwind CSS v4 + Vite 8",
  },
  features: {
    tanstackStart: "TanStack Start",
    tanstackStartDesc:
      "Full-stack React framework with SSR, file-based routing, and server functions.",
    shadcnUi: "shadcn/ui + Tailwind",
    shadcnUiDesc:
      "Beautiful, accessible components with Tailwind CSS v4 and CSS variables theming.",
    i18n: "i18n Ready",
    i18nDesc: "Internationalization support with locale routing and language switching.",
    webVitals: "Web Vitals",
    webVitalsDesc: "Built-in performance monitoring with CLS, FCP, INP, LCP, and TTFB tracking.",
    envValidation: "Type-Safe Env",
    envValidationDesc:
      "Environment variable validation with Zod schemas for both server and client.",
    cloudflare: "Cloudflare Ready",
    cloudflareDesc: "Deploy to Cloudflare Workers with SSR and server functions support.",
  },
  footer: {
    builtWith: "Built with",
  },
} as const;
