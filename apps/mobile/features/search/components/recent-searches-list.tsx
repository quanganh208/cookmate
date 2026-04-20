import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

interface RecentSearchesListProps {
  entries: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

/** Renders the idle-state "Recent searches" list with per-item remove + Clear All. */
export function RecentSearchesList({
  entries,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchesListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <FontAwesome6 name="clock-rotate-left" size={24} color={Colors.textSecondary} />
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
          No recent searches yet.{'\n'}Try searching for a recipe above.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>Recent</Text>
        <Pressable onPress={onClearAll} accessibilityRole="button" accessibilityLabel="Clear all">
          <Text style={[Typography.meta, { color: Colors.primary }]}>Clear all</Text>
        </Pressable>
      </View>
      {entries.map((entry) => (
        <View key={entry} style={styles.row}>
          <Pressable
            style={styles.rowPress}
            onPress={() => onSelect(entry)}
            accessibilityRole="button"
            accessibilityLabel={`Search ${entry}`}
          >
            <FontAwesome6 name="clock-rotate-left" size={14} color={Colors.textSecondary} />
            <Text style={[Typography.body, { color: Colors.textPrimary, flex: 1 }]}>{entry}</Text>
          </Pressable>
          <Pressable
            onPress={() => onRemove(entry)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${entry}`}
          >
            <FontAwesome6 name="xmark" size={14} color={Colors.textSecondary} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 8,
  },
  rowPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
});
