import { createFileRoute } from "@tanstack/react-router";

import { requireUser } from "@/lib/server/auth";
import { ensureSchema, type SavedRecordRow } from "@/lib/server/db";
import { json, readJson } from "@/lib/server/http";
import { getAppEnv } from "@/lib/server/runtime-env";

type SaveBody = {
  matchId?: string;
  uniqueKey?: string;
  [key: string]: unknown;
};

export const Route = createFileRoute("/api/saved/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        const env = getAppEnv();
        await ensureSchema(env.DB);
        const { results } = await env.DB.prepare(
          "SELECT id, user_id, saved_at, updated_at, match_id, unique_key, payload, current_payload FROM saved_records WHERE user_id = ? ORDER BY id DESC LIMIT 500",
        )
          .bind(auth.user.id)
          .all<SavedRecordRow>();

        return json(
          (results || []).map((item) => ({
            id: item.id,
            savedAt: item.saved_at,
            updatedAt: item.updated_at,
            matchId: item.match_id,
            uniqueKey: item.unique_key,
            row: JSON.parse(item.current_payload || item.payload),
          })),
        );
      },
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        const row = await readJson<SaveBody>(request);
        const matchId = row?.matchId ? String(row.matchId) : "";
        const uniqueKey = String(row?.uniqueKey || "");
        if (!row || !uniqueKey) {
          return json({ error: "uniqueKey is required" }, 400);
        }

        const env = getAppEnv();
        await ensureSchema(env.DB);
        const existing = await env.DB.prepare(
          "SELECT id FROM saved_records WHERE user_id = ? AND unique_key = ? LIMIT 1",
        )
          .bind(auth.user.id, uniqueKey)
          .first<{ id: number }>();

        if (existing) {
          return json({ error: "duplicate", duplicate: true }, 409);
        }

        await env.DB.prepare(
          "INSERT INTO saved_records (user_id, match_id, unique_key, payload, current_payload) VALUES (?, ?, ?, ?, ?)",
        )
          .bind(
            auth.user.id,
            matchId || null,
            uniqueKey,
            JSON.stringify({ ...row, uniqueKey }),
            JSON.stringify({ ...row, uniqueKey }),
          )
          .run();

        const inserted = await env.DB.prepare(
          "SELECT id FROM saved_records WHERE user_id = ? AND unique_key = ? LIMIT 1",
        )
          .bind(auth.user.id, uniqueKey)
          .first<{ id: number }>();

        return json({ id: inserted?.id || 0 }, 201);
      },
    },
  },
});
