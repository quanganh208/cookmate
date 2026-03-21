import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/shared/constants/colors';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';
import { CATEGORIES } from '@/shared/types';
import { useRecipeUIStore } from '@/features/recipes/store';
import { HomeHeader } from '@/features/home/components/home-header';
import { SearchBarShortcut } from '@/features/home/components/search-bar-shortcut';
import { FeaturedCarousel } from '@/features/home/components/featured-carousel';
import { TrendingSection } from '@/features/home/components/trending-section';
import { CategoryChips } from '@/shared/components/category-chips';
import { RecipeCardFeatured } from '@/shared/components/recipe-card-featured';
import { RecipeCardCompact } from '@/shared/components/recipe-card-compact';

const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;

/** Home screen — recipe feed with featured, trending, and filtered sections */
export function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const selectedCategory = useRecipeUIStore((s) => s.selectedCategory);
  const setSelectedCategory = useRecipeUIStore((s) => s.setSelectedCategory);

  const featuredRecipes = useMemo(
    () => MOCK_RECIPES.filter((r) => r.isFeatured),
    [],
  );

  // Top 6 by like count for trending
  const trendingRecipes = useMemo(
    () => [...MOCK_RECIPES].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6),
    [],
  );

  // Filter non-featured recipes by category
  const recentRecipes = useMemo(() => {
    const nonFeatured = MOCK_RECIPES.filter((r) => !r.isFeatured);
    if (selectedCategory === 'All') return nonFeatured;
    return nonFeatured.filter((r) => r.category === selectedCategory);
  }, [selectedCategory]);

  const handleRecipePress = (id: string) => {
    router.push(`/recipe/${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeHeader />
        <SearchBarShortcut />

        <CategoryChips
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <FeaturedCarousel
          recipes={featuredRecipes}
          onRecipePress={handleRecipePress}
        />

        <TrendingSection
          recipes={trendingRecipes}
          onRecipePress={handleRecipePress}
        />

        {/* Recent Recipes — mixed layout */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
        </View>

        {recentRecipes.length === 0 ? (
          <Text style={styles.emptyText}>No recipes in this category</Text>
        ) : (
          <>
            {/* First item: full-width featured card */}
            <RecipeCardFeatured
              recipe={recentRecipes[0]}
              onPress={() => handleRecipePress(recentRecipes[0].id)}
            />

            {/* Rest: 2-column grid */}
            <View style={styles.grid}>
              {recentRecipes.slice(1).map((recipe) => (
                <View key={recipe.id} style={{ width: cardWidth }}>
                  <RecipeCardCompact
                    recipe={recipe}
                    onPress={() => handleRecipePress(recipe.id)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  recentHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
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
});
