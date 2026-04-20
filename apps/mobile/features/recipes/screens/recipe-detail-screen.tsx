import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/shared/constants/colors';
import { ErrorView } from '@/shared/components/error-view';
import { useAuthStore } from '@/features/auth/store';
import { useRecipe } from '../hooks/use-recipe-detail';
import { RecipeHero } from '../components/recipe-hero';
import { RecipeIngredients } from '../components/recipe-ingredients';
import { RecipeSteps } from '../components/recipe-steps';
import { RecipeDetailSkeleton } from '../components/recipe-detail-skeleton';
import { SaveButton } from '../components/save-button';

/**
 * Recipe detail screen. Pulls data via `useRecipe` (passes `view: true` so the
 * server counts this as a real page view), shows a skeleton during fetch, and
 * an `ErrorView` with retry on failure.
 */
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAuthed = useAuthStore((s) => s.status === 'authenticated');
  const { data: recipe, isLoading, isError, error, refetch } = useRecipe(id, { view: true });

  if (isLoading || (!recipe && !isError)) {
    return <RecipeDetailSkeleton />;
  }

  if (isError || !recipe) {
    return (
      <View style={styles.container}>
        <ErrorView
          title="Couldn't load recipe"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <RecipeHero recipe={recipe} />
        <RecipeIngredients ingredients={recipe.ingredients ?? []} />
        <RecipeSteps steps={recipe.steps ?? []} />
      </ScrollView>
      {isAuthed && id ? (
        <View style={styles.saveWrapper} pointerEvents="box-none">
          <SaveButton recipeId={id} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  saveWrapper: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
