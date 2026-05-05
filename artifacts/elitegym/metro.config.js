// artifacts/elitegym/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 🛑 Désactiver lightningcss (double sécurité)
config.transformer = {
  ...config.transformer,
  cssTransform: {
    engine: 'default',
    // Désactiver les optimisations CSS avancées qui nécessitent lightningcss
    cssModules: false,
  },
};

// Optionnel : désactiver le minifier CSS en dev
if (process.env.NODE_ENV === 'development') {
  config.minifier = false;
}

module.exports = config;