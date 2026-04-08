import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';

interface AuthSubmitButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Primary CTA button used by login/register/reset submit actions. */
export function AuthSubmitButton({ label, onPress, loading, disabled }: AuthSubmitButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.surface} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.surface,
  },
});
