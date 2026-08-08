import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { RecipeCard } from '@/components/RecipeCard';
import { Colors, spacing } from '@/components/theme';
import { EmptyState, Screen } from '@/components/ui';
import { addMissingIngredients } from '@/data/shopping';
import { CookTier, RankedRecipe, rankRecipes } from '@/domain/match';
import { RecipeIngredient } from '@/domain/types';
import { useHousehold } from '@/lib/store';
import { useThemedStyles } from '@/lib/theme';

const SECTIONS: { tier: CookTier; title: string; hint: string }[] = [
  {
    tier: 'cookable',
    title: 'Cook now',
    hint: 'Everything you need is in the pantry, soonest-expiring food first.',
  },
  {
    tier: 'almost',
    title: 'Almost there',
    hint: "A few ingredients short — add what's missing to the shopping list.",
  },
  {
    tier: 'rest',
    title: 'Needs a shop',
    hint: 'Further off, but here when you want to plan ahead.',
  },
];

export default function CookScreen() {
  const styles = useThemedStyles(makeStyles);
  const { householdId, items, recipes, shopping } = useHousehold();
  const router = useRouter();
  const [busyRecipeId, setBusyRecipeId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const ranked = useMemo(() => rankRecipes(recipes, items), [recipes, items]);

  // One list, ordered by how close each recipe is; the headings only label the
  // bands of that order, so an empty band disappears rather than showing a gap.
  const sections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        data: ranked.filter((match) => match.tier === section.tier),
      })).filter((section) => section.data.length > 0),
    [ranked],
  );

  async function addMissing(recipeId: string, ingredients: RecipeIngredient[]) {
    if (!householdId) return;
    setBusyRecipeId(recipeId);
    try {
      const added = await addMissingIngredients(householdId, recipeId, ingredients, shopping);
      setNote(
        added === 0
          ? 'Everything missing was already on the shopping list.'
          : `Added ${added} ${added === 1 ? 'item' : 'items'} to the shopping list.`,
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not update the shopping list.');
    } finally {
      setBusyRecipeId(null);
    }
  }

  function actionFor(match: RankedRecipe) {
    if (match.missing.length === 0) return undefined;
    return {
      title: 'Add missing to shopping list',
      loading: busyRecipeId === match.recipe.id,
      onPress: () => void addMissing(match.recipe.id, match.missing),
    };
  }

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(match) => match.recipe.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hint}>
              Your recipes, closest to cookable first.
            </Text>
            {note ? <Text style={styles.note}>{note}</Text> : null}
            <Link href="/recipe/new" style={styles.link}>
              + Add your own recipe
            </Link>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {section.title} · {section.data.length}
            </Text>
            <Text style={styles.sectionHint}>{section.hint}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RecipeCard
            match={item}
            onPress={() => router.push(`/recipe/${item.recipe.id}`)}
            action={actionFor(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="No recipes yet"
            hint="Add your own recipes, or import some from the Discover tab."
          />
        }
      />
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
    header: { gap: spacing.sm, marginBottom: spacing.md },
    hint: { fontSize: 14, color: colors.textMuted },
    note: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    sectionHeader: { gap: 2, marginTop: spacing.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    sectionHint: { fontSize: 13, color: colors.textMuted },
    separator: { height: spacing.md },
  });
