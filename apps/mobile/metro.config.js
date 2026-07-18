const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

// expo/metro-config auto-detects the Bun workspace root; no manual
// watchFolders/nodeModulesPaths needed (SDK 56+).
const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: "./src/global.css" })
