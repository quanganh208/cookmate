import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

/** Tappable search bar that navigates to the Search tab */
export function SearchBarShortcut() {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/search')}
      accessibilityRole="search"
      accessibilityLabel="Search recipes"
    >
      <FontAwesome6 name="magnifying-glass" size={16} color={Colors.textSecondary} />
      <Text style={[Typography.body, styles.placeholder]}>Search recipes...</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
});
