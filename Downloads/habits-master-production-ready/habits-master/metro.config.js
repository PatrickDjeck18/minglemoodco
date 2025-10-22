// Metro configuration for web bundling with React Navigation and Vector Icons support
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for additional asset types
config.resolver.assetExts.push(
  'ttf', 'otf', 'woff', 'woff2', 'eot'
);

// Add extra node modules for web compatibility
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'web-streams-polyfill/ponyfill/es6': path.resolve(__dirname, 'node_modules/web-streams-polyfill/dist/ponyfill.es6.mjs'),
};

// Add asset plugins
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Fix for React Navigation assets
config.resolver.alias = {
  ...config.resolver.alias,
  'missing-asset-registry-path': path.resolve(__dirname, 'node_modules/react-native/Libraries/Image/AssetRegistry'),
};

// Fix for vector icons fonts
config.resolver.alias = {
  ...config.resolver.alias,
  '@expo/vector-icons': path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
};

module.exports = config;