import { hashPassword, randomToken, sha256 } from "@/lib/server/crypto";
import { ensureSchema, type SessionUser, type UserRow } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { getAppEnv } from "@/lib/server/runtime-env";

const sessionCookieName = "football_session";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 14;

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const pair = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

function sessionCookie(token: string, expires: Date, secure: boolean) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expires.toUTCString()}`,
  ];
  if (secure) parts.splice(4, 0, "Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  return [`${sessionCookieName}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"].join("; ");
}

export async function ensureAdminUser() {
  const env = getAppEnv();
  await ensureSchema(env.DB);

  const username = env.APP_ADMIN_USERNAME || "admin";
  let passwordHash = env.APP_ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    const fallbackPassword = env.APP_ADMIN_PASSWORD || "local-session-secret";
    passwordHash = await hashPassword(
      fallbackPassword,
      username,
      env.SESSION_SECRET || "local-session-secret",
    );
  }

  const statement = env.APP_ADMIN_PASSWORD_HASH
    ? "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)"
    : "INSERT INTO users (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash";

  await env.DB.prepare(statement).bind(username, passwordHash).run();
}

export async function loginUser(username: string, password: string) {
  const env = getAppEnv();
  await ensureAdminUser();

  const user = await env.DB.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?",
  )
    .bind(username)
    .first<UserRow>();

  const submittedHash = await hashPassword(
    password,
    username,
    env.SESSION_SECRET || "local-session-secret",
  );
  if (!user || user.password_hash !== submittedHash) {
    return null;
  }

  const token = randomToken();
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + sessionTtlMs);

  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, user.id, expires.toISOString())
    .run();

  return {
    user: { id: user.id, username: user.username },
    cookie: sessionCookie(
      token,
      expires,
      env.ENVIRONMENT === "test" || env.ENVIRONMENT === "production",
    ),
  };
}

export async function logoutUser(request: Request) {
  const env = getAppEnv();
  const token = cookieValue(request, sessionCookieName);
  if (token) {
    await ensureSchema(env.DB);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
}

export async function getCurrentUser(request: Request): Promise<SessionUser | null> {
  const env = getAppEnv();
  const token = cookieValue(request, sessionCookieName);
  if (!token) return null;

  await ensureSchema(env.DB);
  const user = await env.DB.prepare(
    "SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > datetime('now')",
  )
    .bind(await sha256(token))
    .first<SessionUser>();

  return user || null;
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { user: null, response: json({ error: "unauthorized" }, 401) };
  }
  return { user, response: null };
}
