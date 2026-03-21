import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AnimatedPressable } from '@/shared/components/animated-pressable';
import type { Recipe } from '@/features/recipes/types';

interface RecipeCardFeaturedProps {
  recipe: Recipe;
  onPress: () => void;
}

/** Full-width recipe card with gradient overlay and press animation */
export function RecipeCardFeatured({ recipe, onPress }: RecipeCardFeaturedProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={recipe.title}
    >
      <Image
        source={recipe.imageUrl}
        style={styles.image}
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text style={[Typography.recipeTitle, { color: Colors.textPrimary }]} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.authorRow}>
            <Image
              source={recipe.author.avatarUrl}
              style={styles.avatar}
              transition={200}
            />
            <Text style={[Typography.meta, { color: Colors.textSecondary }]}>
              {recipe.author.name}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
              {recipe.cookTime} min
            </Text>
            <Text style={styles.difficultyBadge}>{recipe.difficulty}</Text>
            <View style={styles.likeRow}>
              <FontAwesome6 name="heart" size={12} color={Colors.primary} />
              <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                {recipe.likeCount}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  image: { width: '100%', aspectRatio: 4 / 3 },
  content: { padding: 12, gap: 8 },
  metaRow: { gap: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  difficultyBadge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
