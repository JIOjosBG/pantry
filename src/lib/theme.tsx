import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeName, themes } from '@/components/theme';

const STORAGE_KEY = 'pantry.theme';

type ThemeContextValue = {
  theme: ThemeName;
  colors: Colors;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme: ThemeName = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [picked, setPicked] = useState<ThemeName | null>(null);

  // Until the stored choice loads we follow the system, so the first frame is
  // never the wrong colour for people who have no preference saved.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && (stored === 'light' || stored === 'dark')) setPicked(stored);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = picked ?? systemTheme;

  const setTheme = useCallback((next: ThemeName) => {
    setPicked(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: themes[theme],
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Outside a provider (tests, isolated renders) this still resolves to a usable
 * palette from the system scheme rather than throwing.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const systemTheme: ThemeName = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    context ?? {
      theme: systemTheme,
      colors: themes[systemTheme],
      setTheme: () => {},
      toggleTheme: () => {},
    }
  );
}

/** Build a StyleSheet from the active palette, rebuilt only when it changes. */
export function useThemedStyles<T>(factory: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
