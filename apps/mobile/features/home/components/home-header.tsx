import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

/** Top header with warm-styled app logo, notification bell, and user avatar */
export function HomeHeader() {
  return (
    <View style={styles.container}>
      <Text style={[Typography.appTitle, { color: Colors.primary }]}>Cookmate</Text>
      <View style={styles.actions}>
        <FontAwesome6 name="bell" size={22} color={Colors.textPrimary} />
        <Image
          source="https://i.pravatar.cc/100?u=me"
          style={styles.avatar}
          placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={300}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
});
