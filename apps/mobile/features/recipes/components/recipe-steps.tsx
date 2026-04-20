import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import type { RecipeStep } from '../types';

interface RecipeStepsProps {
  steps: RecipeStep[];
}

/** Numbered step list with optional step images. */
export function RecipeSteps({ steps }: RecipeStepsProps) {
  if (!steps || steps.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Instructions" />
        <Text style={[Typography.body, { color: Colors.textSecondary }]}>
          No instructions provided.
        </Text>
      </View>
    );
  }
  const ordered = [...steps].sort((a, b) => a.number - b.number);
  return (
    <View style={styles.section}>
      <SectionHeader title="Instructions" count={ordered.length} />
      {ordered.map((step) => (
        <View key={step.number} style={styles.row}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{step.number}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[Typography.body, { color: Colors.textPrimary, lineHeight: 22 }]}>
              {step.description}
            </Text>
            {step.imageUrl ? (
              <Image
                source={step.imageUrl}
                style={styles.stepImage}
                placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
                contentFit="cover"
                transition={200}
              />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.header}>
      <FontAwesome6 name="utensils" size={14} color={Colors.primary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
      {count != null ? (
        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>({count})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: '#fff', fontWeight: '700' },
  stepImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8 },
});
