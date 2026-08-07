import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/components/theme';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function SignInScreen() {
  const { signIn, signingIn, error } = useAuth();

  return (
    <Screen style={styles.screen}>
      <Card style={styles.card}>
        <Text style={styles.emoji}>🥕</Text>
        <Text style={styles.title}>Pantry</Text>
        <Text style={styles.subtitle}>
          Track what's in the fridge, cook what's about to expire, and keep one shopping list
          between the two of you.
        </Text>

        <Button title="Continue with Google" onPress={signIn} loading={signingIn} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 420, gap: spacing.md, alignItems: 'stretch' },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
});
