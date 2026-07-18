import expoConfig from "eslint-config-expo/flat.js"

export default [
  {
    name: "workspace/native-ignores",
    ignores: ["**/.expo/**", "**/expo-env.d.ts"],
  },
  ...expoConfig,
  {
    name: "workspace/native-overrides",
    rules: {
      // Rejects the injected-ref store seam the session provider is built on.
      "react-hooks/refs": "off",
    },
  },
]
