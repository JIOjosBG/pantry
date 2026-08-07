import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { QtyStepper } from '@/components/ItemRow';
import { categoryEmoji, colors, spacing } from '@/components/theme';
import { Button, Card, Chips, EmptyState, Field, Screen } from '@/components/ui';
import { addShoppingEntry, adjustShoppingQty, removeShoppingEntry } from '@/data/shopping';
import { ShoppingEntry, UNITS, Unit } from '@/domain/types';
import { useHousehold } from '@/lib/store';

export default function ShoppingScreen() {
  const { householdId, shopping } = useHousehold();
  const router = useRouter();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<Unit>('piece');
  const [error, setError] = useState<string | null>(null);

  // Entries arrive sorted by category, so a single pass produces the headings.
  const rows = useMemo(() => {
    const out: ({ kind: 'header'; key: string; title: string } | { kind: 'entry'; key: string; entry: ShoppingEntry })[] = [];
    let lastCategory: string | null = null;
    for (const entry of shopping) {
      if (entry.category !== lastCategory) {
        lastCategory = entry.category;
        out.push({ kind: 'header', key: `h-${entry.category}`, title: entry.category });
      }
      out.push({ kind: 'entry', key: entry.id, entry });
    }
    return out;
  }, [shopping]);

  async function add() {
    if (!householdId) return;
    const parsedQty = Number(qty.replace(',', '.'));
    if (name.trim().length === 0) return setError('Give the item a name.');
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return setError('Quantity must be above 0.');

    setError(null);
    await addShoppingEntry(householdId, { name, qty: parsedQty, unit });
    setName('');
    setQty('1');
  }

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Card style={styles.form}>
            <Field label="Add to list" value={name} onChangeText={setName} placeholder="Bacon" />
            <View style={styles.formRow}>
              <Field
                label="Quantity"
                value={qty}
                onChangeText={setQty}
                keyboardType="decimal-pad"
                style={styles.qtyField}
              />
            </View>
            <Chips options={UNITS} value={unit} onChange={setUnit} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Add" onPress={add} variant="secondary" />
          </Card>
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={styles.sectionTitle}>
              {categoryEmoji[item.title as keyof typeof categoryEmoji]} {item.title}
            </Text>
          ) : (
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {item.entry.name}
              </Text>
              <View style={styles.rowActions}>
                <QtyStepper
                  qty={item.entry.qty}
                  unit={item.entry.unit}
                  onChange={(delta) =>
                    householdId && void adjustShoppingQty(householdId, item.entry, delta)
                  }
                />
                <View style={styles.rowButtons}>
                  <Button
                    title="Bought"
                    variant="secondary"
                    style={styles.bought}
                    onPress={() => router.push(`/shopping/review?entryId=${item.entry.id}`)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.entry.name}`}
                    onPress={() =>
                      householdId && void removeShoppingEntry(householdId, item.entry.id)
                    }
                  >
                    <Text style={styles.remove}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="Shopping list is empty"
            hint="Add things by hand, or let the Cook now tab fill in what recipes are missing."
          />
        }
      />

      {shopping.length > 0 ? (
        <View style={styles.footer}>
          <Button
            title={`Bought all (${shopping.length})`}
            onPress={() => router.push('/shopping/review')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  formRow: { flexDirection: 'row', gap: spacing.md },
  qtyField: { width: 110 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bought: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  remove: { fontSize: 18, color: colors.danger, paddingHorizontal: spacing.sm },
  separator: { height: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
