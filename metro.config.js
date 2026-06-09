// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle .svg files as static assets so expo-image can render them
// (expo-image supports SVG rendering for local/remote sources).
config.resolver.assetExts.push('svg');

module.exports = config;
