import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Colors, radius, spacing } from '@/components/theme';
import { Button, Card, EmptyState, Field, Loading, Screen } from '@/components/ui';
import { importedSpoonacularIds, saveRecipe } from '@/data/recipes';
import {
  DiscoverRecipe,
  SpoonacularError,
  isSpoonacularConfigured,
  searchByIngredients,
  searchRecipes,
} from '@/data/spoonacular';
import { useHousehold } from '@/lib/store';
import { useThemedStyles } from '@/lib/theme';

export default function DiscoverScreen() {
  const styles = useThemedStyles(makeStyles);
  const { householdId, items, recipes } = useHousehold();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoverRecipe[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const alreadyImported = importedSpoonacularIds(recipes);

  async function run(search: () => Promise<DiscoverRecipe[]>) {
    setError(null);
    setSearching(true);
    try {
      setResults(await search());
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof SpoonacularError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Search failed.',
      );
    } finally {
      setSearching(false);
    }
  }

  async function importRecipe(recipe: DiscoverRecipe) {
    if (!householdId) return;
    setSavingId(recipe.spoonacularId);
    try {
      const { missedCount, ...toSave } = recipe;
      void missedCount;
      await saveRecipe(householdId, toSave);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the recipe.');
    } finally {
      setSavingId(null);
    }
  }

  if (!isSpoonacularConfigured) {
    return (
      <Screen>
        <EmptyState
          title="Spoonacular isn't set up"
          hint="Add EXPO_PUBLIC_SPOONACULAR_KEY to .env and restart Expo to search their recipe database. Your own recipes work without it."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={results}
        keyExtractor={(recipe) => String(recipe.spoonacularId)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Card style={styles.form}>
            <Field
              label="Search recipes"
              value={query}
              onChangeText={setQuery}
              placeholder="pasta, curry, tofu…"
              onSubmitEditing={() => query.trim() && void run(() => searchRecipes(query))}
              returnKeyType="search"
            />
            <Button
              title="Search"
              onPress={() => query.trim() && void run(() => searchRecipes(query))}
              disabled={query.trim().length === 0 || searching}
            />
            <Button
              title={`Use what's in my pantry (${items.length})`}
              variant="secondary"
              disabled={items.length === 0 || searching}
              onPress={() =>
                void run(() => searchByIngredients(items.map((item) => item.nameKey)))
              }
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>
        }
        renderItem={({ item }) => {
          const imported = alreadyImported.has(item.spoonacularId);
          return (
            <View style={styles.card}>
              <View style={styles.cardMain}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Text style={styles.imageFallbackText}>🍲</Text>
                  </View>
                )}
                <View style={styles.cardText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta}>
                    {item.ingredients.length} ingredients · serves {item.servings}
                  </Text>
                  {item.missedCount !== undefined ? (
                    <Text style={styles.meta}>
                      {item.missedCount === 0
                        ? 'You have everything'
                        : `${item.missedCount} ingredient${item.missedCount === 1 ? '' : 's'} you don't have`}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Button
                title={imported ? 'Already in my recipes' : 'Add to my recipes'}
                variant="secondary"
                disabled={imported}
                loading={savingId === item.spoonacularId}
                onPress={() => void importRecipe(item)}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          searching ? (
            <Loading label="Searching Spoonacular…" />
          ) : searched ? (
            <EmptyState title="No recipes found" hint="Try a different search term." />
          ) : (
            <EmptyState
              title="Find something new"
              hint="Search by name, or build a list around what's already in your fridge."
            />
          )
        }
      />
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
    form: { gap: spacing.md, marginBottom: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.md,
    },
    cardMain: { flexDirection: 'row', gap: spacing.md },
    image: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.bg },
    imageFallback: { alignItems: 'center', justifyContent: 'center' },
    imageFallbackText: { fontSize: 28 },
    cardText: { flex: 1, gap: 2 },
    title: { fontSize: 16, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
    separator: { height: spacing.md },
    error: { color: colors.danger, fontSize: 14 },
  });
