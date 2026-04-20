import { StyleSheet, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';

/** Static-placeholder skeleton for the detail screen while `useRecipe` loads. */
export function RecipeDetailSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Loading recipe"
      accessibilityRole="progressbar"
    >
      <View style={styles.hero} />
      <View style={styles.body}>
        <View style={[styles.bar, { width: '70%', height: 28 }]} />
        <View style={styles.badgeRow}>
          <View style={styles.badge} />
          <View style={styles.badge} />
          <View style={styles.badge} />
        </View>
        <View style={[styles.bar, { width: '40%', height: 16 }]} />
        <View style={[styles.bar, { width: '100%', height: 14 }]} />
        <View style={[styles.bar, { width: '95%', height: 14 }]} />
        <View style={[styles.bar, { width: '85%', height: 14 }]} />
        <View style={{ height: 16 }} />
        <View style={[styles.bar, { width: '50%', height: 20 }]} />
        <View style={[styles.bar, { width: '80%', height: 14 }]} />
        <View style={[styles.bar, { width: '70%', height: 14 }]} />
        <View style={[styles.bar, { width: '60%', height: 14 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { width: '100%', height: 280, backgroundColor: Colors.divider },
  body: { padding: 16, gap: 10 },
  bar: { backgroundColor: Colors.divider, borderRadius: 6 },
  badgeRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  badge: {
    width: 60,
    height: 22,
    borderRadius: 12,
    backgroundColor: Colors.divider,
  },
});
