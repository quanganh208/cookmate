import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { RecipeIngredient } from '../types';

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[];
}

function formatLine(ing: RecipeIngredient): string {
  const parts: string[] = [];
  if (ing.amount != null) parts.push(String(ing.amount));
  if (ing.unit) parts.push(ing.unit);
  parts.push(ing.name);
  const base = parts.join(' ');
  return ing.note ? `${base} (${ing.note})` : base;
}

/** Bulleted list of ingredients for the detail screen. */
export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  if (!ingredients || ingredients.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Ingredients" />
        <Text style={[Typography.body, { color: Colors.textSecondary }]}>
          No ingredients listed.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <SectionHeader title="Ingredients" count={ingredients.length} />
      {ingredients.map((ing, i) => (
        <View key={`${ing.name}-${i}`} style={styles.row}>
          <View style={styles.bullet} />
          <Text style={[Typography.body, { color: Colors.textPrimary, flex: 1 }]}>
            {formatLine(ing)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.header}>
      <FontAwesome6 name="list" size={14} color={Colors.primary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
      {count != null ? (
        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>({count})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 10,
  },
});
