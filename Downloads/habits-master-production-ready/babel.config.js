module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add Flow syntax support for Expo modules
      '@babel/plugin-syntax-flow',
      // Other plugins for React Native web compatibility
      '@babel/plugin-transform-export-namespace-from',
    ],
  };
};