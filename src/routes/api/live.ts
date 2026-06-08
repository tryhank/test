import { createFileRoute } from "@tanstack/react-router";

import { requireUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { getLatestLiveData } from "@/lib/server/sync";

export const Route = createFileRoute("/api/live")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        try {
          const data = await getLatestLiveData();
          return json(data);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return json({ error: message }, 500);
        }
      },
    },
  },
});
