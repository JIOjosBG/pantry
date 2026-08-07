import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { auth, isFirebaseConfigured } from './firebase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  /** True until the first auth state callback fires. */
  initializing: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** How long to wait for Firebase's first auth-state callback before giving up. */
const AUTH_INIT_TIMEOUT_MS = 8000;

/**
 * A variable that is present but blank in .env arrives as "", which slips past
 * expo-auth-session's "must be defined" check and produces an OAuth request with
 * an empty client id. Treat blank as absent so the failure is a clear message.
 */
function envOrUndefined(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const GOOGLE_CLIENT_IDS = {
  clientId: envOrUndefined(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  iosClientId: envOrUndefined(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  androidClientId: envOrUndefined(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
};

/** Which client id expo-auth-session needs on this platform, if it's missing. */
function missingClientIdMessage(): string | null {
  const needed = Platform.select({
    ios: { key: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', value: GOOGLE_CLIENT_IDS.iosClientId },
    android: {
      key: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
      value: GOOGLE_CLIENT_IDS.androidClientId,
    },
    default: { key: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', value: GOOGLE_CLIENT_IDS.clientId },
  });
  if (needed?.value || GOOGLE_CLIENT_IDS.clientId) return null;
  return `Google sign-in on this platform needs ${needed?.key} in .env.`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On native, signInWithPopup is unavailable — expo-auth-session runs the
  // OAuth flow in a browser and hands back an id_token we exchange with Firebase.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInitializing(false);
      return;
    }
    // Firebase can stall before reporting either way (blocked storage, an
    // unreachable auth domain). Falling back to the sign-in screen beats
    // leaving the app on a spinner with nothing to act on.
    const timeout = setTimeout(() => setInitializing(false), AUTH_INIT_TIMEOUT_MS);

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(
        auth(),
        (next) => {
          setUser(next);
          setInitializing(false);
        },
        (err) => {
          setError(err.message);
          setInitializing(false);
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Firebase auth.');
      setInitializing(false);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        setError(response.error?.message ?? 'Google sign-in failed.');
        setSigningIn(false);
      }
      return;
    }
    const idToken = response.params.id_token;
    if (!idToken) {
      setError('Google did not return an ID token.');
      setSigningIn(false);
      return;
    }
    signInWithCredential(auth(), GoogleAuthProvider.credential(idToken))
      .catch((err: Error) => setError(err.message))
      .finally(() => setSigningIn(false));
  }, [response]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signingIn,
      error,
      async signIn() {
        setError(null);
        setSigningIn(true);
        try {
          if (Platform.OS === 'web') {
            await signInWithPopup(auth(), new GoogleAuthProvider());
            setSigningIn(false);
            return;
          }
          const missingClientId = missingClientIdMessage();
          if (missingClientId) {
            setError(missingClientId);
            setSigningIn(false);
            return;
          }
          if (!request) {
            setError('Google sign-in is not configured for this platform yet.');
            setSigningIn(false);
            return;
          }
          const result = await promptAsync();
          // A dismissed browser tab leaves us waiting forever otherwise.
          if (result.type !== 'success') setSigningIn(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Sign-in failed.');
          setSigningIn(false);
        }
      },
      async signOut() {
        await firebaseSignOut(auth());
      },
    }),
    [user, initializing, signingIn, error, request, promptAsync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
