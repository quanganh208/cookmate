import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { Recipe } from '@/features/recipes/types';

interface FeaturedCarouselProps {
  recipes: Recipe[];
  onRecipePress: (id: string) => void;
}

/** Auto-scrolling carousel with parallax animation and warm gradient overlay */
export function FeaturedCarousel({ recipes, onRecipePress }: FeaturedCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const isSwiping = useRef(false);

  if (recipes.length === 0) return null;

  return (
    <View style={styles.container}>
      <Carousel
        width={screenWidth}
        height={220}
        data={recipes}
        autoPlay
        autoPlayInterval={5000}
        scrollAnimationDuration={800}
        onSnapToItem={setActiveIndex}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
          parallaxAdjacentItemScale: 0.75,
        }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onTouchStart={(e) => {
              touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
              isSwiping.current = false;
            }}
            onTouchMove={(e) => {
              const dx = Math.abs(e.nativeEvent.pageX - touchStart.current.x);
              const dy = Math.abs(e.nativeEvent.pageY - touchStart.current.y);
              if (dx > 5 || dy > 5) isSwiping.current = true;
            }}
            onPress={() => {
              if (!isSwiping.current) onRecipePress(item.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Featured: ${item.title}`}
          >
            <Image
              source={item.imageUrl}
              style={styles.image}
              placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient colors={['transparent', 'rgba(45,24,16,0.75)']} style={styles.gradient}>
              <Text style={[Typography.sectionTitle, { color: '#fff' }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.85)' }]}>
                {item.author.name} · {item.cookTime} min
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      />
      {/* Dot indicators */}
      <View style={styles.dots}>
        {recipes.map((r, i) => (
          <View key={r.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  card: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
});
