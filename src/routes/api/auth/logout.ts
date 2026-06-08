import { createFileRoute } from "@tanstack/react-router";

import { clearSessionCookie, logoutUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await logoutUser(request);
        return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
      },
    },
  },
});
