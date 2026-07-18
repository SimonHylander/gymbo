import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  {
    name: "workspace/ignores",
    ignores: [
      "**/.output/**",
      "**/convex/_generated/**",
      "**/eslint.config.js",
    ],
  },
  ...tanstackConfig,
  {
    name: "workspace/overrides",
    rules: {
      // Sound only with noUncheckedIndexedAccess, which no package enables.
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
]
