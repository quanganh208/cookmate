import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AnimatedPressable } from '@/shared/components/animated-pressable';

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Generic error view with optional retry — reused across feature screens. */
export function ErrorView({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
  retryLabel = 'Retry',
}: ErrorViewProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <FontAwesome6 name="triangle-exclamation" size={32} color={Colors.error} />
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
        {message}
      </Text>
      {onRetry ? (
        <AnimatedPressable onPress={onRetry} style={styles.button} accessibilityLabel={retryLabel}>
          <Text style={[Typography.body, styles.buttonText]}>{retryLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
