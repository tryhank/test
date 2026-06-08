import { createFileRoute } from "@tanstack/react-router";

import { requireUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { syncFootballData } from "@/lib/server/sync";

export const Route = createFileRoute("/api/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        try {
          const result = await syncFootballData();
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return json({ error: message }, 500);
        }
      },
    },
  },
});
