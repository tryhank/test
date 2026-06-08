import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isCloudflare = process.env.BUILD_TARGET === "cloudflare";

export default defineConfig(async () => {
  const plugins = [
    devtools(),
    tanstackStart(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ];

  if (isCloudflare) {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.unshift(cloudflare({ viteEnvironment: { name: "ssr" } }));
  } else {
    const { nitro } = await import("nitro/vite");
    plugins.splice(2, 0, nitro());
  }

  return {
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3000,
    },
    plugins,
  };
});
