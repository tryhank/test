export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
};

export type SessionUser = {
  id: number;
  username: string;
};

export type SnapshotRow = {
  id: number;
  captured_at: string;
  payload: string;
};

export type SavedRecordRow = {
  id: number;
  user_id: number;
  saved_at: string;
  updated_at: string;
  match_id: string | null;
  unique_key: string;
  payload: string;
  current_payload: string | null;
};

async function getTableColumns(db: AppDatabase, tableName: string) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all<{
    name: string;
  }>();
  return new Set((results || []).map((column) => column.name));
}

async function addColumnIfMissing(
  db: AppDatabase,
  tableName: string,
  columns: Set<string>,
  columnName: string,
  definition: string,
) {
  if (columns.has(columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  columns.add(columnName);
}

export async function ensureSchema(db: AppDatabase) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    )
    .run();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    )
    .run();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS upstream_auth (id INTEGER PRIMARY KEY CHECK (id = 1), cookie TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
    )
    .run();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, captured_at TEXT NOT NULL DEFAULT (datetime('now')), payload TEXT NOT NULL)",
    )
    .run();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS saved_records (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, saved_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), match_id TEXT, unique_key TEXT NOT NULL, payload TEXT NOT NULL, current_payload TEXT)",
    )
    .run();

  const savedRecordColumns = await getTableColumns(db, "saved_records");
  await addColumnIfMissing(db, "saved_records", savedRecordColumns, "user_id", "INTEGER");
  await addColumnIfMissing(db, "saved_records", savedRecordColumns, "updated_at", "TEXT");
  await addColumnIfMissing(db, "saved_records", savedRecordColumns, "current_payload", "TEXT");
  await db.prepare("UPDATE saved_records SET user_id = 1 WHERE user_id IS NULL").run();
  await db
    .prepare(
      "UPDATE saved_records SET updated_at = COALESCE(saved_at, datetime('now')) WHERE updated_at IS NULL",
    )
    .run();
  await db
    .prepare("UPDATE saved_records SET current_payload = payload WHERE current_payload IS NULL")
    .run();

  await db
    .prepare("CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_username ON users (username)")
    .run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)")
    .run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_snapshots_id ON snapshots (id DESC)").run();
  await db.prepare("DROP INDEX IF EXISTS uniq_saved_records_key").run();
  await db
    .prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS uniq_saved_records_user_key ON saved_records (user_id, unique_key)",
    )
    .run();
  await db
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_saved_records_user_saved_at ON saved_records (user_id, saved_at DESC)",
    )
    .run();
}
