import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

interface SearchEmptyStateProps {
  query: string;
}

/** Shown when a search completed but produced zero hits. */
export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      <FontAwesome6 name="magnifying-glass" size={32} color={Colors.textSecondary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary, textAlign: 'center' }]}>
        No results
      </Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
        We couldn&apos;t find anything matching {`"${query}"`}.{'\n'}Try a different keyword.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 8,
  },
});
