import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AuthGate } from '@/features/auth/components/auth-gate';

function CreateRecipeContent() {
  return (
    <View style={styles.container}>
      <FontAwesome6 name="plus" size={48} color={Colors.primary} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>Create Recipe</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

/** Create recipe tab. Guarded by AuthGate — guests must login before authoring content. */
export function CreateRecipeScreen() {
  return (
    <AuthGate reason="Sign in to share your recipes with the community.">
      <CreateRecipeContent />
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
