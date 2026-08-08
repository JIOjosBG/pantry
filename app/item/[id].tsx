import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateField } from '@/components/DateField';
import { Colors, spacing } from '@/components/theme';
import { Button, Card, Chips, EmptyState, Field, Screen } from '@/components/ui';
import { removeItem, updateItem } from '@/data/items';
import { CATEGORIES, Category, UNITS, Unit } from '@/domain/types';
import { useHousehold } from '@/lib/store';
import { useThemedStyles } from '@/lib/theme';

export default function EditItemScreen() {
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId, items } = useHousehold();
  const router = useRouter();
  const item = items.find((candidate) => candidate.id === id);

  const [name, setName] = useState(item?.name ?? '');
  const [qty, setQty] = useState(String(item?.qty ?? 1));
  const [unit, setUnit] = useState<Unit>(item?.unit ?? 'piece');
  const [category, setCategory] = useState<Category>(item?.category ?? 'other');
  const [expiry, setExpiry] = useState(item?.expiry ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item || !householdId) {
    return (
      <Screen>
        <EmptyState title="Item not found" hint="It may have been used up or removed." />
      </Screen>
    );
  }

  async function save() {
    const parsedQty = Number(qty.replace(',', '.'));
    if (name.trim().length === 0) return setError('Give the item a name.');
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return setError('Quantity must be above 0.');

    setError(null);
    setSaving(true);
    try {
      await updateItem(householdId!, item!.id, {
        name,
        qty: parsedQty,
        unit,
        category,
        expiry,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the item.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Field label="Name" value={name} onChangeText={setName} />
          <View style={styles.row}>
            <Field
              label="Quantity"
              value={qty}
              onChangeText={setQty}
              keyboardType="decimal-pad"
              style={styles.qtyField}
            />
          </View>
          <Text style={styles.label}>Unit</Text>
          <Chips options={UNITS} value={unit} onChange={setUnit} />
          <Text style={styles.label}>Category</Text>
          <Chips options={CATEGORIES} value={category} onChange={setCategory} />
          <DateField label="Expires" value={expiry} onChange={setExpiry} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Save changes" onPress={save} loading={saving} />
        </Card>

        <Button
          title="Remove from pantry"
          variant="danger"
          onPress={async () => {
            await removeItem(householdId!, item!.id);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
    },
    card: { gap: spacing.md },
    row: { flexDirection: 'row', gap: spacing.md },
    qtyField: { width: 120 },
    label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    error: { color: colors.danger, fontSize: 14 },
  });
