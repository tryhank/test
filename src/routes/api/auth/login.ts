import { createFileRoute } from "@tanstack/react-router";

import { loginUser } from "@/lib/server/auth";
import { json, readJson } from "@/lib/server/http";

type LoginBody = {
  username?: string;
  password?: string;
};

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readJson<LoginBody>(request);
          const username = String(body?.username || "").trim();
          const password = String(body?.password || "");

          if (!username || !password) {
            return json({ error: "username and password are required" }, 400);
          }

          const result = await loginUser(username, password);
          if (!result) {
            return json({ error: "invalid credentials" }, 401);
          }

          return json({ user: result.user }, 200, {
            "set-cookie": result.cookie,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return json({ error: message }, 500);
        }
      },
    },
  },
});
