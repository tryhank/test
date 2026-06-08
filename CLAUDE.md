# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server on http://localhost:3000
pnpm build            # Production build (Nitro)
pnpm build:cloudflare # Production build (Cloudflare Workers) — uses BUILD_TARGET=cloudflare
pnpm preview          # Preview production build locally
pnpm lint             # Oxlint with type-aware checking
pnpm lint:fix         # Oxlint with auto-fix
pnpm format           # Oxfmt formatter
pnpm format:check     # Check formatting without writing
pnpm check            # format + lint combined
pnpm type-check       # tsc --noEmit
pnpm ui add <name>    # Add shadcn/ui component (proxied through pnpm dlx shadcn@latest)
```

## Architecture

**TanStack Start** SSR app with file-based routing, React 19, and React Compiler.

### Frontend Architecture

@docs/frontend-architecture-guide.md
