import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';

interface AuthFooterLinkProps {
  prompt: string;
  ctaLabel: string;
  onPress: () => void;
}

/** "Already have an account? Login" style footer row used across auth screens. */
export function AuthFooterLink({ prompt, ctaLabel, onPress }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={styles.cta}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  prompt: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
