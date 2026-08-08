import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { matchIngredients } from '@/domain/match';
import { nameKey } from '@/domain/normalize';
import { PantryItem, RecipeIngredient, ShoppingEntry } from '@/domain/types';
import { useThemedStyles } from '@/lib/theme';
import { Colors, radius, spacing } from './theme';
import { Button, Card } from './ui';

/** What the modal needs of a Discover result — its ingredients carry no nameKey yet. */
export type DiscoverRecipeDetail = {
  title: string;
  image?: string;
  servings: number;
  steps: string[];
  ingredients: { name: string; qty: number; unit: RecipeIngredient['unit'] }[];
};

/**
 * Detail view for a recipe you haven't imported yet: what the pantry already
 * covers, what it doesn't, and a way to put each missing ingredient straight on
 * the shopping list.
 */
export function DiscoverRecipeModal({
  recipe,
  items,
  shopping,
  onAddToCart,
  onClose,
  footer,
}: {
  recipe: DiscoverRecipeDetail | null;
  items: PantryItem[];
  shopping: ShoppingEntry[];
  onAddToCart: (ingredient: RecipeIngredient) => Promise<void>;
  onClose: () => void;
  /** The import action, so the modal doesn't need to know how recipes are saved. */
  footer?: React.ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!recipe) return [];
    const ingredients: RecipeIngredient[] = recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      nameKey: nameKey(ingredient.name),
    }));
    return matchIngredients(ingredients, items);
  }, [recipe, items]);

  const onList = useMemo(() => new Set(shopping.map((entry) => entry.nameKey)), [shopping]);

  const have = matches.filter((match) => match.satisfied);
  const missing = matches.filter((match) => !match.satisfied);

  async function addToCart(ingredient: RecipeIngredient) {
    setAddingKey(ingredient.nameKey + ingredient.name);
    setError(null);
    try {
      await onAddToCart(ingredient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add it to the shopping list.');
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <Modal
      visible={recipe !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {recipe?.title ?? ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close recipe"
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {recipe ? (
            <ScrollView contentContainerStyle={styles.content}>
              {recipe.image ? (
                <Image source={{ uri: recipe.image }} style={styles.hero} resizeMode="cover" />
              ) : null}

              <Text style={styles.meta}>
                {recipe.ingredients.length} ingredients · serves {recipe.servings} ·{' '}
                {missing.length === 0 ? 'you have everything' : `${missing.length} to buy`}
              </Text>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>In your pantry ({have.length})</Text>
                {have.length === 0 ? (
                  <Text style={styles.hint}>Nothing for this one yet.</Text>
                ) : (
                  have.map((match) => (
                    <View
                      key={match.ingredient.nameKey + match.ingredient.name}
                      style={styles.ingredient}
                    >
                      <Text style={styles.tick}>{match.approximate ? '≈' : '✓'}</Text>
                      <Text style={styles.ingredientName}>
                        {match.ingredient.qty} {match.ingredient.unit} {match.ingredient.name}
                      </Text>
                    </View>
                  ))
                )}
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>You don't have ({missing.length})</Text>
                {missing.length === 0 ? (
                  <Text style={styles.hint}>Nothing to buy — you can cook this now.</Text>
                ) : (
                  missing.map((match) => {
                    const { ingredient } = match;
                    const key = ingredient.nameKey + ingredient.name;
                    const listed = onList.has(ingredient.nameKey);
                    return (
                      <View key={key} style={styles.missingRow}>
                        <View style={styles.ingredient}>
                          <Text style={styles.tick}>✗</Text>
                          <Text style={[styles.ingredientName, styles.ingredientMissing]}>
                            {ingredient.qty} {ingredient.unit} {ingredient.name}
                          </Text>
                        </View>
                        <Button
                          title={listed ? 'On the list' : 'Add to cart'}
                          variant="secondary"
                          disabled={listed}
                          loading={addingKey === key}
                          onPress={() => void addToCart(ingredient)}
                          style={styles.cartButton}
                        />
                      </View>
                    );
                  })
                )}
                {error ? <Text style={styles.error}>{error}</Text> : null}
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

              {footer}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      paddingTop: spacing.md,
    },
    handleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
    close: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    closeText: { fontSize: 18, color: colors.textMuted },
    content: { padding: spacing.lg, gap: spacing.md },
    hero: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.border },
    meta: { fontSize: 14, color: colors.textMuted },
    card: { gap: spacing.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    hint: { fontSize: 14, color: colors.textMuted },
    ingredient: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', flex: 1 },
    tick: { fontSize: 15, width: 16, color: colors.textMuted },
    ingredientName: { flex: 1, fontSize: 15, color: colors.text },
    ingredientMissing: { color: colors.danger, fontWeight: '600' },
    missingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    cartButton: { paddingVertical: spacing.sm, minHeight: 36 },
    step: { fontSize: 15, color: colors.text, lineHeight: 22 },
    error: { color: colors.danger, fontSize: 14 },
  });
