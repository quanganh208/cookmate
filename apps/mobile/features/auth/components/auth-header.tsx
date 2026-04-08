import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

/** Title + subtitle block for auth screens. */
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Cookmate</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  brand: {
    fontFamily: Fonts.headingBold,
    fontSize: 28,
    color: Colors.primary,
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
