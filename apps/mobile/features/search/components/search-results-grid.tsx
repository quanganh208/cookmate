import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { RecipeCardCompact } from '@/shared/components/recipe-card-compact';
import type { Recipe } from '@/shared/types/recipe';

const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;

interface SearchResultsGridProps {
  recipes: Recipe[];
  onRecipePress: (id: string) => void;
}

/** 2-column grid reusing the home-feed card. Rendering is driven by parent
 *  — pagination + loading footer live in the screen that owns the query. */
export function SearchResultsGrid({ recipes, onRecipePress }: SearchResultsGridProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

  return (
    <View style={styles.grid}>
      {recipes.map((recipe) => (
        <View key={recipe.id} style={{ width: cardWidth }}>
          <RecipeCardCompact recipe={recipe} onPress={() => onRecipePress(recipe.id)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GRID_GAP,
    paddingBottom: 24,
  },
});
