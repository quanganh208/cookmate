import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AnimatedPressable } from '@/shared/components/animated-pressable';
import type { Recipe } from '@/features/recipes/types';

interface RecipeCardCompactProps {
  recipe: Recipe;
  onPress: () => void;
}

/** Compact recipe card for 2-column grid layout with press animation */
export function RecipeCardCompact({ recipe, onPress }: RecipeCardCompactProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card} accessibilityLabel={recipe.title}>
      <Image
        source={recipe.imageUrl}
        style={styles.image}
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text
          style={[Typography.meta, { color: Colors.textPrimary, fontWeight: '600' }]}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <Text style={[Typography.caption, { color: Colors.textSecondary }]} numberOfLines={1}>
          {recipe.author.name} · {recipe.cookTime} min
        </Text>
        <View style={styles.likeRow}>
          <FontAwesome6 name="heart" size={10} color={Colors.primary} />
          <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
            {recipe.likeCount}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  image: { width: '100%', aspectRatio: 1 },
  content: { padding: 8, gap: 3 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
