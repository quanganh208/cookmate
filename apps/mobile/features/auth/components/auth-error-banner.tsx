import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';

interface AuthErrorBannerProps {
  message?: string | null;
}

/** Inline error banner shown above auth submit buttons. Renders nothing when no message. */
export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDE8E8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.error,
  },
});
