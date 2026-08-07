import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/components/theme';
import { Button, Card, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { HouseholdError, createHousehold, joinHousehold } from '@/lib/household';

export default function HouseholdScreen() {
  const { user, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'create' | 'join') {
    if (!user) return;
    setError(null);
    setBusy(kind);
    try {
      if (kind === 'create') await createHousehold(user);
      else await joinHousehold(user, code);
      // The route guard moves us into the app once /users/{uid}/householdId lands.
    } catch (err) {
      setError(
        err instanceof HouseholdError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Something went wrong.',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Set up your household</Text>
        <Text style={styles.subtitle}>
          A household is one shared pantry, shopping list and recipe book. Create one, or join the
          one your flatmate already made.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Start a new household</Text>
          <Text style={styles.cardHint}>
            You'll get an invite code to share with whoever else uses this fridge.
          </Text>
          <Button
            title="Create household"
            onPress={() => run('create')}
            loading={busy === 'create'}
            disabled={busy !== null}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Join with an invite code</Text>
          <Field
            label="Invite code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="ABC123"
            maxLength={8}
          />
          <Button
            title="Join household"
            onPress={() => run('join')}
            loading={busy === 'join'}
            disabled={busy !== null || code.trim().length === 0}
            variant="secondary"
          />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Sign out" onPress={signOut} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  heading: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  card: { gap: spacing.md },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardHint: { fontSize: 14, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
});
