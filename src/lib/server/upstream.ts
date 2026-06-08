import { ensureSchema } from "@/lib/server/db";
import { getAppEnv } from "@/lib/server/runtime-env";

const baseUrl = "http://175.27.210.75:19226";
const loginPath = "/api/users/login";
const footballDataPath = "/api/water/getFootballData";

const weekdayScopes = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

function getShanghaiWeekdayScope() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(new Date());
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return weekdayScopes[index >= 0 ? index : 0];
}

function defaultFootballPayload() {
  return {
    JCPointSin: 0.1,
    JCPointChuan: 0.14,
    HGPoint: 0.025,
    JCTzAmt: "10000",
    scope: getShanghaiWeekdayScope(),
    outMatch: [],
    inMatch: [],
  };
}

function baseHeaders() {
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/json;charset=UTF-8",
    origin: baseUrl,
    pragma: "no-cache",
    referer: `${baseUrl}/`,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
  };
}

function isLoginExpired(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const payload = data as { success?: boolean; error?: unknown; message?: unknown };
  const rawMessage = payload.error || payload.message || "";
  const message = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);
  return payload.success === false && (message.includes("重新登陆") || message.includes("登录"));
}

function collectSetCookie(response: Response) {
  const anyHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = anyHeaders.getSetCookie?.() || [];
  const fallback = response.headers.get("set-cookie");
  if (fallback) cookies.push(fallback);
  return cookies
    .flatMap((cookie) => cookie.split(/,(?=\s*[^;,\s]+=)/))
    .map((cookie) => cookie.trim().split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function getStoredCookie() {
  const env = getAppEnv();
  await ensureSchema(env.DB);
  const row = await env.DB.prepare("SELECT cookie FROM upstream_auth WHERE id = 1").first<{
    cookie: string;
  }>();
  return row?.cookie || "";
}

async function storeCookie(cookie: string) {
  const env = getAppEnv();
  await env.DB.prepare(
    "INSERT INTO upstream_auth (id, cookie, updated_at) VALUES (1, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET cookie = excluded.cookie, updated_at = datetime('now')",
  )
    .bind(cookie)
    .run();
}

async function loginUpstream() {
  const env = getAppEnv();
  const account = env.FOOTBALL_ACCOUNT || (env.ENVIRONMENT ? undefined : "zz123456");
  const password = env.FOOTBALL_PASSWORD || (env.ENVIRONMENT ? undefined : "zz123456");

  if (!account || !password) {
    throw new Error("Missing FOOTBALL_ACCOUNT or FOOTBALL_PASSWORD");
  }

  const response = await fetch(`${baseUrl}${loginPath}`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({
      account,
      password,
    }),
  });

  const cookie = collectSetCookie(response);
  if (!response.ok || !cookie) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upstream login failed: ${response.status} ${text}`);
  }

  await storeCookie(cookie);
  return cookie;
}

async function requestFootballData(cookie: string) {
  const response = await fetch(`${baseUrl}${footballDataPath}`, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      cookie,
    },
    body: JSON.stringify(defaultFootballPayload()),
  });

  const data = await response.json().catch(() => null);
  if (isLoginExpired(data)) {
    return data;
  }
  if (!response.ok) {
    throw new Error(`Upstream data failed: ${response.status} ${JSON.stringify(data)}`);
  }
  if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
    throw new Error(`Upstream data returned failure: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function fetchFootballData() {
  let cookie = await getStoredCookie();
  if (!cookie) cookie = await loginUpstream();

  const first = await requestFootballData(cookie);
  if (!isLoginExpired(first)) return first;

  cookie = await loginUpstream();
  return requestFootballData(cookie);
}
