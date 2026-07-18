import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    pool: "forks",
    env: { AUTH_PROVIDER: "dev" },
  },
})
