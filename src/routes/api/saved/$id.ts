import { createFileRoute } from "@tanstack/react-router";

import { requireUser } from "@/lib/server/auth";
import { ensureSchema } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { getAppEnv } from "@/lib/server/runtime-env";

export const Route = createFileRoute("/api/saved/$id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        const id = Number(params.id);
        if (!Number.isInteger(id)) {
          return json({ error: "invalid id" }, 400);
        }

        const env = getAppEnv();
        await ensureSchema(env.DB);
        await env.DB.prepare("DELETE FROM saved_records WHERE id = ? AND user_id = ?")
          .bind(id, auth.user.id)
          .run();

        return json({ ok: true });
      },
    },
  },
});
