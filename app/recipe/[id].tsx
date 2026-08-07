import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/components/theme';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { consumeItems } from '@/data/items';
import { removeRecipe } from '@/data/recipes';
import { addMissingIngredients } from '@/data/shopping';
import { expiryLabel } from '@/domain/expiry';
import { matchRecipe, plannedUsage } from '@/domain/match';
import { useHousehold } from '@/lib/store';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId, items, recipes, shopping } = useHousehold();
  const router = useRouter();
  const [busy, setBusy] = useState<'cook' | 'shop' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const recipe = recipes.find((candidate) => candidate.id === id);
  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, items) : null),
    [recipe, items],
  );

  if (!recipe || !match || !householdId) {
    return (
      <Screen>
        <EmptyState title="Recipe not found" hint="It may have been deleted." />
      </Screen>
    );
  }

  const usage = plannedUsage(match);
  const cookable = match.missing.length === 0;

  async function cook() {
    setBusy('cook');
    try {
      await consumeItems(householdId!, usage);
      setNote('Cooked — the ingredients have been taken out of the pantry.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not update the pantry.');
    } finally {
      setBusy(null);
    }
  }

  async function addMissing() {
    setBusy('shop');
    try {
      const added = await addMissingIngredients(householdId!, recipe!.id, match!.missing, shopping);
      setNote(
        added === 0
          ? 'Everything missing was already on the shopping list.'
          : `Added ${added} ${added === 1 ? 'item' : 'items'} to the shopping list.`,
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not update the shopping list.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.hero} resizeMode="cover" />
        ) : null}

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          Serves {recipe.servings} · {recipe.source === 'user' ? 'Your recipe' : 'From Spoonacular'}
        </Text>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {match.matches.map((ingredientMatch) => {
            const { ingredient, satisfied, approximate, items: matched } = ingredientMatch;
            const soonest =
              matched.length > 0
                ? matched.reduce((a, b) => (a.expiry <= b.expiry ? a : b))
                : null;
            return (
              <View key={ingredient.nameKey + ingredient.name} style={styles.ingredient}>
                <Text style={styles.tick}>{satisfied ? (approximate ? '≈' : '✓') : '✗'}</Text>
                <View style={styles.ingredientText}>
                  <Text style={[styles.ingredientName, !satisfied && styles.ingredientMissing]}>
                    {ingredient.qty} {ingredient.unit} {ingredient.name}
                  </Text>
                  {soonest ? (
                    <Text style={styles.ingredientHint}>
                      In your pantry: {soonest.qty} {soonest.unit} ·{' '}
                      {expiryLabel(soonest.expiry).toLowerCase()}
                      {approximate ? ' (amount not comparable)' : ''}
                    </Text>
                  ) : (
                    <Text style={styles.ingredientHint}>Not in your pantry</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        {recipe.steps.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Method</Text>
            {recipe.steps.map((step, index) => (
              <Text key={index} style={styles.step}>
                {index + 1}. {step}
              </Text>
            ))}
          </Card>
        ) : null}

        {note ? <Text style={styles.note}>{note}</Text> : null}

        {cookable ? (
          <Button
            title="Cooked this — take ingredients out of the pantry"
            onPress={cook}
            loading={busy === 'cook'}
            disabled={usage.length === 0}
          />
        ) : (
          <Button
            title="Add missing to shopping list"
            onPress={addMissing}
            loading={busy === 'shop'}
          />
        )}

        <Button
          title="Delete recipe"
          variant="danger"
          onPress={async () => {
            await removeRecipe(householdId!, recipe!.id);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.border },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  card: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  ingredient: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  tick: { fontSize: 16, width: 18, color: colors.textMuted },
  ingredientText: { flex: 1 },
  ingredientName: { fontSize: 15, color: colors.text },
  ingredientMissing: { color: colors.danger, fontWeight: '600' },
  ingredientHint: { fontSize: 13, color: colors.textMuted },
  step: { fontSize: 15, color: colors.text, lineHeight: 22 },
  note: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
