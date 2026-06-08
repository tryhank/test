# Football Viewer

TanStack Start application for viewing football data, saving rows, and refreshing saved records on a Node server with SQLite storage.

## Stack

- React 19 + TanStack Start / Router / Query
- Tailwind CSS v4 + shadcn/ui-style components
- Nitro Node server
- SQLite file storage via `sql.js`

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The local dev server runs at [http://localhost:3000](http://localhost:3000).

## Environment

```env
VITE_BASE_URL=http://localhost:3000
ENVIRONMENT=local
FOOTBALL_ACCOUNT=zz123456
FOOTBALL_PASSWORD=zz123456
SESSION_SECRET=change-me
APP_ADMIN_USERNAME=admin
APP_ADMIN_PASSWORD=admin
DATABASE_PATH=./data/football.sqlite
FOOTBALL_SYNC_INTERVAL_MS=20000
DISABLE_FOOTBALL_SYNC=false
WS_PORT=3001
VITE_WS_URL=ws://localhost:3001/ws/notifications
DISABLE_WEBSOCKET_NOTIFICATIONS=false
```

`DATABASE_PATH` points to the SQLite database file. The app creates the schema automatically at runtime. The background sync fetches upstream data every 20 seconds by default, stores only the latest snapshot, and updates saved records when their tracked row changes.

Saved-record update notifications are pushed over WebSocket. By default the WebSocket server listens on `WS_PORT`, and the browser connects to `VITE_WS_URL`.

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build Node server output
pnpm start        # Run .output/server/index.mjs
pnpm type-check   # TypeScript check
pnpm lint         # Oxlint
```

## Server Deployment

On the server:

```bash
pnpm install
pnpm build
DATABASE_PATH=./data/football.sqlite pnpm start
```

With pm2:

```bash
pm2 start .output/server/index.mjs --name football
```

Use Nginx or another reverse proxy to forward your domain to the Node server port.
