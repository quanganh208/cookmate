import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import { AuthFormField } from '../components/auth-form-field';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { AuthHeader } from '../components/auth-header';
import { AuthErrorBanner } from '../components/auth-error-banner';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../validation/auth-schemas';
import { useForgotPasswordMutation } from '../hooks/use-forgot-password-mutation';
import { mapAuthError } from '../utils/error-mapper';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useForgotPasswordMutation();

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setSubmitError(null);
    mutation.mutate(values, {
      onError: (err) => setSubmitError(mapAuthError(err)),
      onSuccess: () => setSent(true),
    });
  };

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
          <AuthHeader
            title="Forgot password?"
            subtitle="Enter your registered email and we'll send you a reset link."
          />

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Email sent</Text>
              <Text style={styles.successText}>
                If an account with that email exists, a password reset link has been sent to your
                inbox. Please check your mail (including the Spam folder). The link will expire in
                15 minutes.
              </Text>
              <AuthSubmitButton
                label="Back to sign in"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          ) : (
            <>
              <AuthErrorBanner message={submitError} />

              <AuthFormField
                control={control}
                name="email"
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                errorMessage={errors.email?.message}
              />

              <AuthSubmitButton
                label="Send reset link"
                onPress={handleSubmit(onSubmit)}
                loading={mutation.isPending}
              />

              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                hitSlop={8}
                style={styles.backLinkWrapper}
              >
                <Text style={styles.backLink}>Back to sign in</Text>
              </Pressable>
            </>
          )}
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
  backLinkWrapper: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
  },
  successCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  successText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
});
