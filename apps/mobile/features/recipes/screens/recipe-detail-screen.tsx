import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';

/** Recipe detail screen with warm styling, expo-image, and gradient overlay */
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={[Typography.body, { color: Colors.error }]}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View>
        <Image
          source={recipe.imageUrl}
          style={styles.heroImage}
          placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(45,24,16,0.5)']}
          style={styles.heroGradient}
        />
      </View>
      <View style={styles.content}>
        <Text style={[Typography.appTitle, { color: Colors.textPrimary }]}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.badge}>{recipe.cookTime} min</Text>
          <Text style={styles.badge}>{recipe.difficulty}</Text>
          <Text style={styles.badge}>{recipe.category}</Text>
        </View>
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
        <Text style={[Typography.body, { color: Colors.textPrimary, lineHeight: 24 }]}>
          {recipe.description}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 280 },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: { padding: 16, gap: 12 },
  metaRow: { flexDirection: 'row', gap: 8 },
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
});
