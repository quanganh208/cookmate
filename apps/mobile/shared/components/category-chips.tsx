import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { Category } from '@/features/recipes/types';

interface CategoryChipsProps {
  categories: Category[];
  selected: Category;
  onSelect: (category: Category) => void;
}

/** Horizontal scrollable category filter chips with warm styling */
export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <View style={styles.wrapper}>
      <FlashList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = item === selected;
          return (
            <Pressable
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  Typography.chip,
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.surface,
  },
});
