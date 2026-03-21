import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { Recipe } from '@/features/recipes/types';

interface TrendingSectionProps {
  recipes: Recipe[];
  onRecipePress: (id: string) => void;
}

/** "Trending Now" section with horizontal scroll of compact warm cards */
export function TrendingSection({ recipes, onRecipePress }: TrendingSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>
          Trending Now
        </Text>
        <Text style={[Typography.meta, { color: Colors.primary }]}>See all</Text>
      </View>
      <View style={styles.listWrapper}>
        <FlashList
          horizontal
          data={recipes}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => onRecipePress(item.id)}
              accessibilityRole="button"
            >
              <Image
                source={item.imageUrl}
                style={styles.image}
                placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
                contentFit="cover"
                transition={300}
              />
              <Text
                style={[Typography.meta, { color: Colors.textPrimary, paddingHorizontal: 8, paddingTop: 8 }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[Typography.caption, { color: Colors.textSecondary, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4 }]}
              >
                {item.cookTime} min · {item.difficulty}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listWrapper: {
    height: 190,
    paddingHorizontal: 16,
  },
  card: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  image: {
    width: 160,
    height: 120,
  },
});
