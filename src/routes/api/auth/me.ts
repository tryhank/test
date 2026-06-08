import { createFileRoute } from "@tanstack/react-router";

import { getCurrentUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getCurrentUser(request);
        return json({ user });
      },
    },
  },
});
