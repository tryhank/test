import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Database as SqlJsDatabase } from "sql.js";
import initSqlJs from "sql.js/dist/sql-asm.js";

let sqliteDatabase: AppDatabase | null = null;
let sqlJsDatabasePromise: Promise<SqlJsDatabase> | null = null;

function getDatabasePath() {
  return process.env.DATABASE_PATH || "./data/football.sqlite";
}

function normalizeValue(value: unknown) {
  if (value === undefined) return null;
  return value as string | number | Uint8Array | null;
}

async function openSqlJsDatabase() {
  if (sqlJsDatabasePromise) return sqlJsDatabasePromise;

  sqlJsDatabasePromise = (async () => {
    const SQL = await initSqlJs();

    const databasePath = getDatabasePath();
    mkdirSync(path.dirname(databasePath), { recursive: true });

    if (existsSync(databasePath)) {
      return new SQL.Database(readFileSync(databasePath));
    }

    return new SQL.Database();
  })();

  return sqlJsDatabasePromise;
}

function persistDatabase(database: SqlJsDatabase) {
  const databasePath = getDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });
  writeFileSync(databasePath, Buffer.from(database.export()));
}

class SqlitePreparedStatement implements AppPreparedStatement {
  private readonly values: unknown[];

  constructor(
    private readonly databasePromise: Promise<SqlJsDatabase>,
    private readonly query: string,
    values: unknown[] = [],
  ) {
    this.values = values;
  }

  bind(...values: unknown[]) {
    return new SqlitePreparedStatement(this.databasePromise, this.query, values);
  }

  async first<T = unknown>(column?: string) {
    const database = await this.databasePromise;
    const statement = database.prepare(this.query);
    try {
      statement.bind(this.values.map(normalizeValue));
      if (!statement.step()) return null;
      const row = statement.getAsObject() as Record<string, T>;
      if (column) return row[column] ?? null;
      return row as T;
    } finally {
      statement.free();
    }
  }

  async all<T = unknown>() {
    const database = await this.databasePromise;
    const statement = database.prepare(this.query);
    const rows: T[] = [];
    try {
      statement.bind(this.values.map(normalizeValue));
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return {
        results: rows,
        success: true,
        meta: {},
      };
    } finally {
      statement.free();
    }
  }

  async run<T = unknown>() {
    const database = await this.databasePromise;
    database.run(this.query, this.values.map(normalizeValue));
    persistDatabase(database);
    return {
      results: [] as T[],
      success: true,
      meta: {
        changes: database.getRowsModified(),
        last_row_id: Number(
          database.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] || 0,
        ),
      },
    };
  }
}

class SqliteDatabase implements AppDatabase {
  constructor(private readonly databasePromise: Promise<SqlJsDatabase>) {}

  prepare(query: string) {
    return new SqlitePreparedStatement(this.databasePromise, query);
  }

  async batch<T = unknown>(statements: AppPreparedStatement[]) {
    const results: AppDbResult<T>[] = [];
    for (const statement of statements) {
      results.push(await statement.run<T>());
    }
    return results;
  }
}

export function getSqliteDatabase() {
  if (sqliteDatabase) return sqliteDatabase;
  sqliteDatabase = new SqliteDatabase(openSqlJsDatabase());
  return sqliteDatabase;
}
