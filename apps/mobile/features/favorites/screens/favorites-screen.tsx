import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AuthGate } from '@/features/auth/components/auth-gate';

function FavoritesContent() {
  return (
    <View style={styles.container}>
      <FontAwesome6 name="bookmark" size={48} color={Colors.primary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>Saved Recipes</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

/** Favorites/saved recipes tab. Guarded by AuthGate — guests see a login prompt instead. */
export function FavoritesScreen() {
  return (
    <AuthGate reason="Sign in to view the recipes you've saved.">
      <FavoritesContent />
    </AuthGate>
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
