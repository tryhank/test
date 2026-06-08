import { config } from "dotenv";

import { startNotificationServer } from "@/lib/server/notifications";
import { getSqliteDatabase } from "@/lib/server/sqlite-db";

config();
config({ path: ".env.local", override: false });

let appEnv: AppEnv | null = null;
let nodeSchedulerStarted = false;

export function getAppEnv() {
  appEnv ||= {
    DB: getSqliteDatabase(),
    ENVIRONMENT: (process.env.ENVIRONMENT as AppEnv["ENVIRONMENT"]) || "local",
    VITE_BASE_URL: process.env.VITE_BASE_URL,
    FOOTBALL_ACCOUNT: process.env.FOOTBALL_ACCOUNT,
    FOOTBALL_PASSWORD: process.env.FOOTBALL_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_ADMIN_USERNAME: process.env.APP_ADMIN_USERNAME,
    APP_ADMIN_PASSWORD: process.env.APP_ADMIN_PASSWORD,
    APP_ADMIN_PASSWORD_HASH: process.env.APP_ADMIN_PASSWORD_HASH,
  };
  startNodeScheduler();
  startNotificationServer();
  return appEnv;
}

function startNodeScheduler() {
  if (nodeSchedulerStarted || process.env.DISABLE_FOOTBALL_SYNC === "true") return;
  nodeSchedulerStarted = true;

  const intervalMs = Number(process.env.FOOTBALL_SYNC_INTERVAL_MS || 20_000);
  let running = false;
  const runSync = () => {
    if (running) return;
    running = true;
    void import("@/lib/server/sync")
      .then(({ syncFootballData }) => syncFootballData())
      .catch((error) => {
        console.error("Scheduled football sync failed", error);
      })
      .finally(() => {
        running = false;
      });
  };

  runSync();
  const timer = setInterval(runSync, intervalMs);

  timer.unref?.();
}
