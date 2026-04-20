import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { Recipe } from '../types';

interface RecipeHeroProps {
  recipe: Recipe;
}

/** Hero image with gradient overlay, title, badges, author, and stats. */
export function RecipeHero({ recipe }: RecipeHeroProps) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  return (
    <View>
      <Image
        source={recipe.imageUrl}
        style={styles.heroImage}
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient colors={['transparent', 'rgba(45,24,16,0.5)']} style={styles.heroGradient} />
      <View style={styles.body}>
        <Text style={[Typography.appTitle, { color: Colors.textPrimary }]}>{recipe.title}</Text>

        <View style={styles.badgeRow}>
          {totalTime > 0 ? <Text style={styles.badge}>{totalTime} min</Text> : null}
          {recipe.difficulty ? <Text style={styles.badge}>{recipe.difficulty}</Text> : null}
          {recipe.category ? <Text style={styles.badge}>{recipe.category}</Text> : null}
          {recipe.cuisine ? <Text style={styles.badge}>{recipe.cuisine}</Text> : null}
        </View>

        {recipe.author ? (
          <View style={styles.authorRow}>
            {recipe.author.avatarUrl ? (
              <Image source={recipe.author.avatarUrl} style={styles.avatar} transition={200} />
            ) : null}
            <Text style={[Typography.meta, { color: Colors.textSecondary }]}>
              {recipe.author.displayName}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Stat icon="eye" value={recipe.viewCount ?? 0} label="views" />
          <Stat icon="heart" value={recipe.likeCount} label="likes" />
          {recipe.serving ? <Stat icon="utensils" value={recipe.serving} label="serving" /> : null}
        </View>

        {recipe.description ? (
          <Text style={[Typography.body, { color: Colors.textPrimary, lineHeight: 24 }]}>
            {recipe.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <FontAwesome6 name={icon} size={12} color={Colors.primary} />
      <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
        {value} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroImage: { width: '100%', height: 280 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  body: { padding: 16, gap: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
