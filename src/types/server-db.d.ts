interface AppEnv {
  DB: AppDatabase;
  ENVIRONMENT?: "local" | "test" | "production";
  VITE_BASE_URL?: string;
  FOOTBALL_ACCOUNT?: string;
  FOOTBALL_PASSWORD?: string;
  SESSION_SECRET?: string;
  APP_ADMIN_USERNAME?: string;
  APP_ADMIN_PASSWORD?: string;
  APP_ADMIN_PASSWORD_HASH?: string;
  DATABASE_PATH?: string;
  FOOTBALL_SYNC_INTERVAL_MS?: string;
  DISABLE_FOOTBALL_SYNC?: string;
  WS_HOST?: string;
  WS_PORT?: string;
  DISABLE_WEBSOCKET_NOTIFICATIONS?: string;
}

interface AppDatabase {
  prepare(query: string): AppPreparedStatement;
  batch<T = unknown>(statements: AppPreparedStatement[]): Promise<AppDbResult<T>[]>;
}

interface AppPreparedStatement {
  bind(...values: unknown[]): AppPreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<AppDbResult<T>>;
  run<T = unknown>(): Promise<AppDbResult<T>>;
}

interface AppDbResult<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    changes?: number;
    last_row_id?: number;
    [key: string]: unknown;
  };
}
