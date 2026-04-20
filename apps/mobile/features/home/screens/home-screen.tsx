import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/shared/constants/colors';
import { CATEGORIES } from '@/shared/types';
import {
  flattenRecipePages,
  useFeaturedRecipes,
  useInfiniteRecipes,
  useRecipesByCategory,
} from '@/features/recipes/hooks/use-recipes';
import { useRecipeUIStore } from '@/features/recipes/store';
import { HomeHeader } from '@/features/home/components/home-header';
import { SearchBarShortcut } from '@/features/home/components/search-bar-shortcut';
import { FeaturedCarousel } from '@/features/home/components/featured-carousel';
import { TrendingSection } from '@/features/home/components/trending-section';
import { CategoryChips } from '@/shared/components/category-chips';
import { RecipeCardFeatured } from '@/shared/components/recipe-card-featured';
import { RecipeCardCompact } from '@/shared/components/recipe-card-compact';
import { ErrorView } from '@/shared/components/error-view';

const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;
const END_REACHED_THRESHOLD = 400;

/** Home screen — recipe feed with featured carousel, trending row, and paginated grid. */
export function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const selectedCategory = useRecipeUIStore((s) => s.selectedCategory);
  const setSelectedCategory = useRecipeUIStore((s) => s.setSelectedCategory);

  const featuredQuery = useFeaturedRecipes();
  const allRecipesQuery = useInfiniteRecipes();
  const categoryQuery = useRecipesByCategory(selectedCategory);

  // Pick the active list source: all or filtered-by-category.
  const isCategoryFiltered = selectedCategory !== 'All';
  const recentQuery = isCategoryFiltered ? categoryQuery : allRecipesQuery;

  const featuredRecipes = useMemo(
    () => flattenRecipePages(featuredQuery.data?.pages),
    [featuredQuery.data],
  );
  const recentRecipes = useMemo(
    () => flattenRecipePages(recentQuery.data?.pages),
    [recentQuery.data],
  );
  // Top 6 by likes — first page only to avoid fetching extra data.
  const trendingRecipes = useMemo(() => {
    const firstPage = allRecipesQuery.data?.pages[0]?.content ?? [];
    return [...firstPage].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);
  }, [allRecipesQuery.data]);

  const handleRecipePress = (id: string) => {
    router.push(`/recipe/${id}`);
  };

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
      recentQuery.hasNextPage &&
      !recentQuery.isFetchingNextPage
    ) {
      recentQuery.fetchNextPage();
    }
  };

  const onRefresh = () => {
    featuredQuery.refetch();
    allRecipesQuery.refetch();
    if (isCategoryFiltered) categoryQuery.refetch();
  };

  const isInitialLoading =
    recentQuery.isLoading && !recentQuery.data && featuredQuery.isLoading && !featuredQuery.data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={allRecipesQuery.isRefetching || featuredQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <HomeHeader />
        <SearchBarShortcut />

        {recentQuery.isError ? (
          <View style={styles.errorWrap}>
            <ErrorView
              title="Couldn't load recipes"
              message={
                recentQuery.error instanceof Error
                  ? recentQuery.error.message
                  : 'Pull down to retry.'
              }
              onRetry={() => recentQuery.refetch()}
            />
          </View>
        ) : null}

        <FeaturedCarousel recipes={featuredRecipes} onRecipePress={handleRecipePress} />

        <TrendingSection recipes={trendingRecipes} onRecipePress={handleRecipePress} />

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
        </View>

        <CategoryChips
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {isInitialLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : recentRecipes.length === 0 ? (
          <Text style={styles.emptyText}>No recipes in this category</Text>
        ) : (
          <>
            <RecipeCardFeatured
              recipe={recentRecipes[0]}
              onPress={() => handleRecipePress(recentRecipes[0].id)}
            />
            <View style={styles.grid}>
              {recentRecipes.slice(1).map((recipe) => (
                <View key={recipe.id} style={{ width: cardWidth }}>
                  <RecipeCardCompact recipe={recipe} onPress={() => handleRecipePress(recipe.id)} />
                </View>
              ))}
            </View>
            {recentQuery.isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  recentHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    paddingVertical: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GRID_GAP,
    paddingBottom: 24,
  },
  loader: { marginVertical: 16 },
  errorWrap: { padding: 16 },
});
