import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { ErrorView } from '@/shared/components/error-view';
import { RecipeCardCompact } from '@/shared/components/recipe-card-compact';
import { AuthGate } from '@/features/auth/components/auth-gate';
import { flattenRecipePages } from '@/features/recipes/hooks/use-recipes';
import { useFavorites } from '../hooks/use-favorites';
import { FavoritesEmptyState } from '../components/favorites-empty-state';

const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;
const END_REACHED_THRESHOLD = 400;

function FavoritesContent() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const favoritesQuery = useFavorites();
  const recipes = useMemo(
    () => flattenRecipePages(favoritesQuery.data?.pages),
    [favoritesQuery.data],
  );

  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (
      distanceFromBottom < END_REACHED_THRESHOLD &&
      favoritesQuery.hasNextPage &&
      !favoritesQuery.isFetchingNextPage
    ) {
      favoritesQuery.fetchNextPage();
    }
  };

  if (favoritesQuery.isLoading && !favoritesQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (favoritesQuery.isError) {
    return (
      <ErrorView
        title="Couldn't load favorites"
        message={
          favoritesQuery.error instanceof Error ? favoritesQuery.error.message : 'Please try again.'
        }
        onRetry={() => favoritesQuery.refetch()}
      />
    );
  }

  if (recipes.length === 0) {
    return <FavoritesEmptyState />;
  }

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={200}>
      <View style={styles.header}>
        <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>Saved Recipes</Text>
        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
          {favoritesQuery.data?.pages[0]?.totalElements ?? recipes.length} saved
        </Text>
      </View>
      <View style={styles.grid}>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={{ width: cardWidth }}>
            <RecipeCardCompact
              recipe={recipe}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
            />
          </View>
        ))}
      </View>
      {favoritesQuery.isFetchingNextPage ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : null}
    </ScrollView>
  );
}

/** Favorites/saved recipes tab. Guarded by AuthGate — guests see a login prompt instead. */
export function FavoritesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AuthGate reason="Sign in to view the recipes you've saved.">
        <FavoritesContent />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: HORIZONTAL_PADDING, paddingVertical: 12, gap: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GRID_GAP,
    paddingBottom: 24,
  },
  loader: { marginVertical: 16 },
});
