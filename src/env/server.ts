import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    VITE_BASE_URL: z.url().default("http://localhost:3000"),
    ENVIRONMENT: z.enum(["local", "test", "production"]).default("local"),
    FOOTBALL_ACCOUNT: z.string().optional(),
    FOOTBALL_PASSWORD: z.string().optional(),
    SESSION_SECRET: z.string().default("local-session-secret"),
    APP_ADMIN_USERNAME: z.string().default("admin"),
    APP_ADMIN_PASSWORD: z.string().optional(),
    APP_ADMIN_PASSWORD_HASH: z.string().optional(),
  },
  runtimeEnv: process.env,
});
