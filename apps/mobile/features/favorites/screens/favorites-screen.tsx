import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

/** Favorites/saved recipes screen stub — full implementation coming soon */
export function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <FontAwesome6 name="bookmark" size={48} color={Colors.primary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>Saved Recipes</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
});
