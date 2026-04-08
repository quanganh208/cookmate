import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import { AuthFormField } from '../components/auth-form-field';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { AuthHeader } from '../components/auth-header';
import { AuthErrorBanner } from '../components/auth-error-banner';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../validation/auth-schemas';
import { useResetPasswordMutation } from '../hooks/use-reset-password-mutation';
import { mapAuthError } from '../utils/error-mapper';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const mutation = useResetPasswordMutation();

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) return;
    setSubmitError(null);
    mutation.mutate(
      { token, newPassword: values.newPassword },
      {
        onError: (err) => setSubmitError(mapAuthError(err)),
        onSuccess: () => {
          Alert.alert(
            'Success',
            'Your password has been reset. Please sign in with your new password.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
          );
        },
      },
    );
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <AuthHeader
            title="Invalid link"
            subtitle="This password reset link is missing or has expired. Please request a new one."
          />
          <AuthSubmitButton
            label="Request new link"
            onPress={() => router.replace('/(auth)/forgot-password')}
          />
          <Text style={styles.backLink} onPress={() => router.replace('/(auth)/login')}>
            Back to sign in
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title="Reset password" subtitle="Choose a new password for your account." />

          <AuthErrorBanner message={submitError} />

          <AuthFormField
            control={control}
            name="newPassword"
            label="New password"
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            errorMessage={errors.newPassword?.message}
          />

          <AuthFormField
            control={control}
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            errorMessage={errors.confirmPassword?.message}
          />

          <AuthSubmitButton
            label="Reset password"
            onPress={handleSubmit(onSubmit)}
            loading={mutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  backLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
});
