import tailwind from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  plugins: [
    tailwind(),
    tanstackStart({ server: { entry: "server" } }),
    react(),
    nitro({
      preset: "cloudflare-module",
      cloudflare: { wrangler: { name: "web-match-house" } },
    }),
  ],
});
