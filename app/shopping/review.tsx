import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateField } from '@/components/DateField';
import { categoryEmoji, Colors, spacing } from '@/components/theme';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { buyAll } from '@/data/shopping';
import { PurchasedItem, toPurchaseDrafts } from '@/domain/purchase';
import { useAuth } from '@/lib/auth';
import { useHousehold } from '@/lib/store';
import { useThemedStyles } from '@/lib/theme';

/**
 * The confirmation step behind "Bought all" and a row's "Bought": each entry
 * becomes a pantry item, with an expiry suggested from its category that you
 * can correct before saving.
 *
 * An entryId in the route narrows it to that one item; without it the whole
 * list is reviewed.
 */
export default function ReviewPurchaseScreen() {
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { householdId, shopping } = useHousehold();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const router = useRouter();
  const single = typeof entryId === 'string' && entryId.length > 0;
  // Snapshot the list on mount so live updates can't reshuffle the form underfoot.
  const [drafts, setDrafts] = useState<PurchasedItem[]>(() =>
    toPurchaseDrafts(single ? shopping.filter((entry) => entry.id === entryId) : shopping),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (drafts.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: single ? 'Bought' : 'Bought all' }} />
        <EmptyState
          title="Nothing to move"
          hint={single ? 'That item is no longer on the list.' : 'The shopping list is empty.'}
        />
      </Screen>
    );
  }

  function setExpiry(index: number, expiry: string) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, expiry } : draft)),
    );
  }

  function drop(index: number) {
    setDrafts((current) => current.filter((_, i) => i !== index));
  }

  async function confirm() {
    if (!householdId || !user) return;
    setError(null);
    setSaving(true);
    try {
      await buyAll(householdId, user.uid, drafts);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not move the items.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: single ? 'Bought' : 'Bought all' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          {single
            ? "Check the expiry date — it's an estimate from the item's category. Saving moves this one item into the pantry and takes it off the list."
            : "Check the expiry dates — these are estimates from each item's category. Saving moves everything into the pantry and clears the shopping list."}
        </Text>

        {drafts.map((draft, index) => (
          <Card key={`${draft.name}-${index}`} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>
                {categoryEmoji[draft.category]} {draft.name}
              </Text>
              <Text style={styles.qty}>
                {draft.qty} {draft.unit}
              </Text>
            </View>
            <DateField
              label="Expires"
              value={draft.expiry}
              onChange={(expiry) => setExpiry(index, expiry)}
            />
            {single ? null : (
              <Button title="Didn't buy this" variant="secondary" onPress={() => drop(index)} />
            )}
          </Card>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={
            single
              ? 'Move to pantry'
              : `Move ${drafts.length} ${drafts.length === 1 ? 'item' : 'items'} to pantry`
          }
          onPress={confirm}
          loading={saving}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
    },
    hint: { fontSize: 14, color: colors.textMuted },
    card: { gap: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
    qty: { fontSize: 14, color: colors.textMuted },
    error: { color: colors.danger, fontSize: 14 },
  });
