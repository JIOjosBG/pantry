import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { expiryLabel } from '@/domain/expiry';
import { RecipeMatch } from '@/domain/match';
import { colors, radius, spacing } from './theme';
import { Button } from './ui';

/** The pantry item this recipe should be cooked around, if anything is expiring. */
function urgencyLine(match: RecipeMatch): string | null {
  if (match.usedItems.length === 0) return null;
  const soonest = match.usedItems.reduce((a, b) => (a.expiry <= b.expiry ? a : b));
  if (match.urgency > 7) return null;
  return `Uses ${soonest.name} — ${expiryLabel(soonest.expiry).toLowerCase()}`;
}

export function RecipeCard({
  match,
  onPress,
  action,
}: {
  match: RecipeMatch;
  onPress: () => void;
  action?: { title: string; onPress: () => void; loading?: boolean };
}) {
  const { recipe, missing } = match;
  const urgency = urgencyLine(match);

  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={onPress} accessibilityRole="button">
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>🍳</Text>
          </View>
        )}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.meta}>
            {recipe.ingredients.length} ingredients · serves {recipe.servings}
          </Text>
          {urgency ? <Text style={styles.urgency}>{urgency}</Text> : null}
          {missing.length > 0 ? (
            <Text style={styles.missing} numberOfLines={2}>
              Missing: {missing.map((ingredient) => ingredient.name).join(', ')}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {action ? (
        <Button
          title={action.title}
          onPress={action.onPress}
          loading={action.loading}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  main: { flexDirection: 'row', gap: spacing.md },
  image: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.bg },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 28 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  urgency: { fontSize: 13, color: colors.urgent, fontWeight: '600' },
  missing: { fontSize: 13, color: colors.danger },
});
