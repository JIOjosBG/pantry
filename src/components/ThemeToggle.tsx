import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { Colors, radius, spacing } from './theme';

/** One-tap light/dark switch, sized to sit in a header bar. */
export function ThemeToggle() {
  const styles = useThemedStyles(makeStyles);
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      accessibilityState={{ checked: dark }}
      onPress={toggleTheme}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{dark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    button: {
      marginRight: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    pressed: { backgroundColor: colors.bg },
    icon: { fontSize: 18 },
  });
