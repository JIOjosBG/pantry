import { Pressable, StyleSheet, Text, View } from 'react-native';
import { expiryLabel, expiryStatus } from '@/domain/expiry';
import { PantryItem } from '@/domain/types';
import { categoryEmoji, colors, radius, spacing, statusColor } from './theme';

export function ExpiryBadge({ expiry }: { expiry: string }) {
  const status = expiryStatus(expiry);
  return (
    <View style={[styles.badge, { borderColor: statusColor[status] }]}>
      <Text style={[styles.badgeText, { color: statusColor[status] }]}>
        {status === 'expired' ? `Expired ${expiryLabel(expiry).toLowerCase()}` : expiryLabel(expiry)}
      </Text>
    </View>
  );
}

export function QtyStepper({
  qty,
  unit,
  onChange,
}: {
  qty: number;
  unit: string;
  onChange: (delta: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reduce quantity"
        onPress={() => onChange(-1)}
        style={styles.stepperButton}
      >
        <Text style={styles.stepperSymbol}>−</Text>
      </Pressable>
      <Text style={styles.qty}>
        {qty} {unit}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        onPress={() => onChange(1)}
        style={styles.stepperButton}
      >
        <Text style={styles.stepperSymbol}>+</Text>
      </Pressable>
    </View>
  );
}

export function ItemRow({
  item,
  onAdjust,
  onPress,
  onRemove,
}: {
  item: PantryItem;
  onAdjust: (delta: number) => void;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.rowMain} onPress={onPress} accessibilityRole="button">
        <Text style={styles.emoji}>{categoryEmoji[item.category]}</Text>
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <ExpiryBadge expiry={item.expiry} />
        </View>
      </Pressable>
      <View style={styles.rowActions}>
        <QtyStepper qty={item.qty} unit={item.unit} onChange={onAdjust} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  rowActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emoji: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  badge: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { fontSize: 20, color: colors.text, lineHeight: 22 },
  qty: { fontSize: 15, color: colors.text, minWidth: 70, textAlign: 'center' },
  remove: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  removeText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
});
