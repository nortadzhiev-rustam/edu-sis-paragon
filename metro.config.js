const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to help with module resolution
config.resolver = {
  ...config.resolver,
  // Ensure case sensitivity is handled properly
  platforms: ['ios', 'android', 'native', 'web'],
  // Add explicit file extensions
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
};

module.exports = config;
