import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { DateField } from '@/components/DateField';
import { ItemRow } from '@/components/ItemRow';
import { Colors, spacing } from '@/components/theme';
import { Button, Card, Chips, EmptyState, ErrorBanner, Field, Screen } from '@/components/ui';
import { addItem, adjustQty, removeItem } from '@/data/items';
import { defaultExpiry, expiryStatus } from '@/domain/expiry';
import { guessCategory } from '@/domain/normalize';
import { CATEGORIES, Category, PantryItem, UNITS, Unit } from '@/domain/types';
import { useAuth } from '@/lib/auth';
import { useHousehold } from '@/lib/store';
import { useThemedStyles } from '@/lib/theme';

const SECTION_TITLES: Record<string, string> = {
  expired: 'Expired',
  urgent: 'Use within 2 days',
  soon: 'This week',
  ok: 'Later',
};

function groupByStatus(items: PantryItem[]) {
  const order = ['expired', 'urgent', 'soon', 'ok'] as const;
  return order
    .map((status) => ({
      title: SECTION_TITLES[status],
      status,
      data: items.filter((item) => expiryStatus(item.expiry) === status),
    }))
    .filter((section) => section.data.length > 0);
}

export default function PantryScreen() {
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { householdId, items, error } = useHousehold();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const sections = useMemo(() => groupByStatus(items), [items]);

  function confirmRemove(item: PantryItem) {
    if (!householdId) return;
    const remove = () => void removeItem(householdId, item.id);
    if (Platform.OS === 'web') {
      // Alert.alert has no buttons on web, so confirm() is the honest option.
      if (window.confirm(`Remove ${item.name} from the pantry?`)) remove();
      return;
    }
    Alert.alert('Remove item', `Remove ${item.name} from the pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.count}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              <Link href="/settings" style={styles.link}>
                Household
              </Link>
            </View>
            <Button
              title={showForm ? 'Cancel' : '+ Add item'}
              onPress={() => setShowForm((open) => !open)}
              variant={showForm ? 'secondary' : 'primary'}
            />
            {showForm && householdId && user ? (
              <AddItemForm
                onSubmit={async (item) => {
                  await addItem(householdId, user.uid, item);
                  setShowForm(false);
                }}
              />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onAdjust={(delta) => householdId && void adjustQty(householdId, item, delta)}
            onPress={() => router.push(`/item/${item.id}`)}
            onRemove={() => confirmRemove(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="Your pantry is empty"
            hint="Add what's in the fridge and it'll be sorted by what expires first."
          />
        }
      />
    </Screen>
  );
}

function AddItemForm({
  onSubmit,
}: {
  onSubmit: (item: {
    name: string;
    qty: number;
    unit: Unit;
    category: Category;
    expiry: string;
  }) => Promise<void>;
}) {
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<Unit>('piece');
  const [category, setCategory] = useState<Category>('other');
  const [expiry, setExpiry] = useState(() => defaultExpiry('other'));
  // Only re-suggest the category and expiry while the user hasn't overridden them.
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(next: string) {
    setName(next);
    if (categoryTouched) return;
    const guessed = guessCategory(next);
    setCategory(guessed);
    setExpiry(defaultExpiry(guessed));
  }

  function handleCategoryChange(next: Category) {
    setCategoryTouched(true);
    setCategory(next);
    setExpiry(defaultExpiry(next));
  }

  async function submit() {
    const parsedQty = Number(qty.replace(',', '.'));
    if (name.trim().length === 0) return setError('Give the item a name.');
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return setError('Quantity must be above 0.');

    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name, qty: parsedQty, unit, category, expiry });
      setName('');
      setQty('1');
      setCategoryTouched(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={styles.form}>
      <Field label="Name" value={name} onChangeText={handleNameChange} placeholder="Milk" />
      <View style={styles.formRow}>
        <Field
          label="Quantity"
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          style={styles.qtyField}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
          <Chips options={UNITS} value={unit} onChange={setUnit} />
        </ScrollView>
      </View>
      <Text style={styles.formLabel}>Category</Text>
      <Chips options={CATEGORIES} value={category} onChange={handleCategoryChange} />
      <DateField label="Expires" value={expiry} onChange={setExpiry} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Add to pantry" onPress={submit} loading={saving} />
    </Card>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    list: {
      padding: spacing.lg,
      gap: spacing.sm,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    header: { gap: spacing.md, marginBottom: spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    count: { fontSize: 14, color: colors.textMuted },
    link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    separator: { height: spacing.sm },
    form: { gap: spacing.md },
    formRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
    qtyField: { width: 110 },
    unitScroll: { flex: 1 },
    formLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    error: { color: colors.danger, fontSize: 14 },
  });
