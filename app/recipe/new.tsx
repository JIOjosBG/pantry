import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/components/theme';
import { Button, Card, Chips, Field, Screen } from '@/components/ui';
import { saveRecipe } from '@/data/recipes';
import { UNITS, Unit } from '@/domain/types';
import { useHousehold } from '@/lib/store';

type IngredientDraft = { name: string; qty: string; unit: Unit };

const EMPTY_INGREDIENT: IngredientDraft = { name: '', qty: '1', unit: 'piece' };

export default function NewRecipeScreen() {
  const { householdId } = useHousehold();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('2');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ ...EMPTY_INGREDIENT }]);
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(index: number, changes: Partial<IngredientDraft>) {
    setIngredients((current) =>
      current.map((ingredient, i) => (i === index ? { ...ingredient, ...changes } : ingredient)),
    );
  }

  async function save() {
    if (!householdId) return;
    const named = ingredients.filter((ingredient) => ingredient.name.trim().length > 0);
    if (title.trim().length === 0) return setError('Give the recipe a title.');
    if (named.length === 0) return setError('Add at least one ingredient.');

    const parsed = named.map((ingredient) => ({
      name: ingredient.name,
      qty: Number(ingredient.qty.replace(',', '.')) || 1,
      unit: ingredient.unit,
    }));

    setError(null);
    setSaving(true);
    try {
      await saveRecipe(householdId, {
        title,
        servings: Number(servings) || 2,
        steps: steps.split('\n').map((step) => step.trim()),
        source: 'user',
        ingredients: parsed,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the recipe.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="Tomato pasta" />
          <Field
            label="Servings"
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
            style={styles.servings}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredient}>
              <View style={styles.ingredientTop}>
                <Field
                  label={`Ingredient ${index + 1}`}
                  value={ingredient.name}
                  onChangeText={(name) => updateIngredient(index, { name })}
                  placeholder="Tinned tomatoes"
                  style={styles.grow}
                />
                <Field
                  label="Qty"
                  value={ingredient.qty}
                  onChangeText={(qty) => updateIngredient(index, { qty })}
                  keyboardType="decimal-pad"
                  style={styles.qtyField}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chips
                  options={UNITS}
                  value={ingredient.unit}
                  onChange={(unit) => updateIngredient(index, { unit })}
                />
              </ScrollView>
              {ingredients.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setIngredients((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Text style={styles.remove}>Remove ingredient</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Button
            title="+ Add ingredient"
            variant="secondary"
            onPress={() => setIngredients((current) => [...current, { ...EMPTY_INGREDIENT }])}
          />
        </Card>

        <Card style={styles.card}>
          <Field
            label="Method (one step per line)"
            value={steps}
            onChangeText={setSteps}
            multiline
            numberOfLines={6}
            placeholder={'Fry the onion\nAdd the tomatoes\nSimmer for 20 minutes'}
            style={styles.steps}
          />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save recipe" onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: { gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  servings: { width: 120 },
  ingredient: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  ingredientTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  grow: { flex: 1 },
  qtyField: { width: 90 },
  steps: { minHeight: 120 },
  remove: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
});
