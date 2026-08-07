import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';
import { Platform } from 'react-native';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '',
};

/** Which required env vars are still blank, so the UI can say so plainly. */
export const missingFirebaseConfig = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

/**
 * Everything below is created on first use rather than at import time: the SDK
 * throws on an empty API key, and that would crash the app before it can show
 * the "Firebase isn't configured" screen.
 */
let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Database | null = null;

function app(): FirebaseApp {
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
  }
  return cachedApp;
}

/**
 * On native the JS SDK has no default persistence, so sessions would be lost on
 * every reload; getAuth() is right on web, where it uses IndexedDB.
 */
export function auth(): Auth {
  if (cachedAuth) return cachedAuth;

  if (Platform.OS === 'web') {
    cachedAuth = getAuth(app());
    return cachedAuth;
  }

  try {
    // getReactNativePersistence lives on the RN entry point of firebase/auth.
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (getReactNativePersistence && AsyncStorage) {
      cachedAuth = initializeAuth(app(), {
        persistence: getReactNativePersistence(AsyncStorage) as never,
      });
      return cachedAuth;
    }
  } catch {
    // Fall through: an in-memory session still works, it just won't survive a reload.
  }

  cachedAuth = getAuth(app());
  return cachedAuth;
}

export function db(): Database {
  if (!cachedDb) cachedDb = getDatabase(app());
  return cachedDb;
}
