# TanStack Starter

A minimal, production-ready template for building modern web applications with TanStack Start.

## Tech Stack

- [React 19](https://react.dev) + [React Compiler](https://react.dev/learn/react-compiler)
- TanStack [Start](https://tanstack.com/start/latest) + [Router](https://tanstack.com/router/latest) + [Query](https://tanstack.com/query/latest)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) + [Remix Icon](https://remixicon.com/)
- [Vite 8](https://vite.dev) + [Nitro v3](https://nitro.build/) (local) / [Cloudflare Workers](https://workers.cloudflare.com/) (production)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) + [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)
- [TypeScript](https://www.typescriptlang.org/) strict mode

## Features

| Feature           | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| SSR + Streaming   | TanStack Start with Vite 8, file-based routing                               |
| UI Components     | shadcn/ui + Tailwind CSS v4 (oklch color system)                             |
| Theme Switching   | Light / Dark / System, CSS variables + localStorage                          |
| i18n              | Multi-language support (en/zh), `useTranslations()` hook, `LanguageSwitcher` |
| Env Validation    | Zod schema validation for server & client env vars (`@t3-oss/env-core`)      |
| SEO               | `seo()` utility for meta, Open Graph, Twitter Cards                          |
| Web Vitals        | CLS, FCP, INP, LCP, TTFB monitoring                                          |
| Error Handling    | Localized 404 page, ErrorBoundary, loading states                            |
| Cloudflare Deploy | Dual build target: Nitro (local) + Cloudflare Workers (production)           |
| CI/CD             | GitHub Actions for lint, type-check, build, and deploy                       |
| Code Quality      | Oxlint + Oxfmt + Husky + lint-staged                                         |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10

### Setup

```bash
# Install dependencies
pnpm install

# Create env file
cp .env.example .env

# Start dev server
pnpm dev
```

The dev server runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── components/          # Shared components
│   ├── ui/              # shadcn/ui components (button, dropdown, etc.)
│   ├── header.tsx       # Responsive nav with mobile menu
│   ├── footer.tsx       # Site footer
│   ├── theme-provider.tsx / theme-toggle.tsx   # Theme system
│   ├── i18n-provider.tsx / language-switcher.tsx # i18n system
│   ├── web-vitals.tsx   # Performance monitoring
│   └── default-catch-boundary.tsx / default-not-found.tsx # Error handling
├── env/                 # Environment variable validation
│   ├── client.ts        # Client env (VITE_ prefixed)
│   └── server.ts        # Server env
├── lib/                 # Utilities
│   ├── i18n/index.ts    # i18n core (locales, context, hooks)
│   ├── seo.ts           # SEO meta tag utility
│   └── utils.ts         # cn() class merge utility
├── locales/             # Translation files
│   ├── en.ts
│   └── zh.ts
├── routes/              # File-based routes
│   ├── __root.tsx       # Root layout (html, head, providers)
│   └── index.tsx        # Home page (feature showcase)
├── router.tsx           # Router configuration
└── styles.css           # Global styles + CSS variables (light/dark)
```

## Scripts

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `pnpm dev`                | Start development server                      |
| `pnpm build`              | Build for production (Nitro)                  |
| `pnpm preview`            | Preview production build locally              |
| `pnpm build:cloudflare`   | Build for Cloudflare Workers                  |
| `pnpm preview:cloudflare` | Preview Cloudflare build locally              |
| `pnpm deploy:test`        | Deploy to Cloudflare Workers (test env)       |
| `pnpm deploy:prod`        | Deploy to Cloudflare Workers (production env) |
| `pnpm lint`               | Run Oxlint                                    |
| `pnpm format`             | Run Oxfmt                                     |
| `pnpm format:check`       | Check formatting                              |
| `pnpm check`              | Run format + lint                             |
| `pnpm type-check`         | TypeScript type checking                      |
| `pnpm ui add <component>` | Add shadcn/ui component                       |
| `pnpm deps`               | Upgrade dependencies (interactive)            |

## Deployment

### Cloudflare Workers

1. Set up your [Cloudflare API Token](https://dash.cloudflare.com/profile/api-tokens)

2. Deploy to test environment:

   ```bash
   pnpm deploy:test
   ```

3. Deploy to production:
   ```bash
   pnpm deploy:prod
   ```

Configuration is in [`wrangler.jsonc`](./wrangler.jsonc) with two environments (`test`, `production`). Custom domains can be added in the `routes` section.

### Other Platforms

The default `pnpm build` uses Nitro, which supports [many deployment targets](https://nitro.build/deploy) including Vercel, Netlify, and Node.js.

See the [TanStack Start hosting docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) for more options.

## i18n (Internationalization)

Translations are defined in `src/locales/`. To add a new language:

1. Create a new translation file (e.g., `src/locales/ja.ts`) following the structure of `en.ts`
2. Register the locale in `src/lib/i18n/index.ts`:
   ```typescript
   import ja from "@/locales/ja";
   export const locales = ["en", "zh", "ja"] as const;
   const messages = { en, zh, ja };
   ```
3. Add the label in `src/components/language-switcher.tsx`:
   ```typescript
   const localeLabels: Record<Locale, string> = {
     en: "English",
     zh: "中文",
     ja: "日本語",
   };
   ```

Use translations in components:

```tsx
import { useTranslations } from "@/lib/i18n";

function MyComponent() {
  const { t, locale } = useTranslations();
  return <h1>{t.common.home}</h1>;
}
```

## Theme

Three modes: Light (default), Dark, and System. The theme system uses:

- CSS variables in `src/styles.css` (oklch color space)
- `ThemeProvider` with localStorage persistence
- `ScriptOnce` to prevent flash of unstyled content (FOUC)

## Environment Variables

| Variable        | Scope           | Description                     |
| --------------- | --------------- | ------------------------------- |
| `VITE_BASE_URL` | Client + Server | Site base URL                   |
| `ENVIRONMENT`   | Server          | `local` / `test` / `production` |

Client variables require the `VITE_` prefix. Validation schemas are in `src/env/`.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`** - Runs on push/PR to `main`: format check, lint, type check, build
- **`deploy.yml`** - Manual trigger: build and deploy to Cloudflare Workers (test or production)

## License

Code in this template is public domain via [Unlicense](./LICENSE).

## Credits

Based on [mugnavo/tanstarter](https://github.com/mugnavo/tanstarter).
