import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

/** Shown on the Favorites tab when the user hasn't saved anything yet. */
export function FavoritesEmptyState() {
  return (
    <View style={styles.container}>
      <FontAwesome6 name="heart" size={36} color={Colors.primary} iconStyle="regular" />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary, textAlign: 'center' }]}>
        No saved recipes yet
      </Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
        Tap the heart on any recipe to save it here.
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
