// Loads the monorepo root .env into process.env BEFORE Expo's Metro bundler reads
// `EXPO_PUBLIC_*` vars to embed into the JS bundle. This lets us keep a single source of
// truth at /<repo>/.env (shared with the backend) without needing a duplicate file or
// symlink inside apps/mobile/.
//
// Tiny inline parser — no extra dependency, no quoting/escaping support (not needed for
// our flat KEY=value format).

const fs = require('fs');
const path = require('path');

const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    // Don't override an explicit env var passed in by the parent shell.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Static Expo config — equivalent to the previous app.json. Exported as a function so
// Expo passes the existing config to us; we can also reference process.env values here.
module.exports = ({ config }) => ({
  ...config,
  name: 'Cookmate',
  slug: 'cookmate',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'cookmate',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cookmate.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.cookmate.app',
    // Prevent MMKV (recent searches, query cache) from being silently backed up
    // to Google Drive and restored onto a new device / different user.
    allowBackup: false,
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: 'com.googleusercontent.apps.589585305900-ltjhde87e52sdj9v9s4e94qi5e8chh24',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '',
    },
  },
});
