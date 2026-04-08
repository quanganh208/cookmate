import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@/shared/constants/colors';
import { AuthFormField } from '../components/auth-form-field';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { AuthHeader } from '../components/auth-header';
import { AuthFooterLink } from '../components/auth-footer-link';
import { AuthErrorBanner } from '../components/auth-error-banner';
import { GoogleSignInButton } from '../components/google-sign-in-button';
import { registerSchema, type RegisterFormValues } from '../validation/auth-schemas';
import { useRegisterMutation } from '../hooks/use-register-mutation';
import { useGoogleLogin, GoogleSignInCancelledError } from '../hooks/use-google-login';
import { mapAuthError } from '../utils/error-mapper';

export function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useRegisterMutation();
  const googleLoginMutation = useGoogleLogin();

  const navigateAfterAuth = () => {
    if (params.next) {
      router.replace(params.next as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const onSubmit = (values: RegisterFormValues) => {
    setSubmitError(null);
    const credentials = {
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    };
    registerMutation.mutate(credentials, {
      onError: (err) => setSubmitError(mapAuthError(err)),
      onSuccess: navigateAfterAuth,
    });
  };

  const onGoogleSignIn = () => {
    setSubmitError(null);
    googleLoginMutation.mutate(undefined, {
      onError: (err) => {
        if (err instanceof GoogleSignInCancelledError) return;
        setSubmitError(mapAuthError(err));
      },
      onSuccess: navigateAfterAuth,
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
            title="Create an account"
            subtitle="Join the community and share your favorite recipes."
          />

          <AuthErrorBanner message={submitError} />

          <AuthFormField
            control={control}
            name="displayName"
            label="Display name"
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            errorMessage={errors.displayName?.message}
          />

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

          <AuthFormField
            control={control}
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            errorMessage={errors.password?.message}
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
            label="Sign up"
            onPress={handleSubmit(onSubmit)}
            loading={registerMutation.isPending}
          />

          <GoogleSignInButton onPress={onGoogleSignIn} loading={googleLoginMutation.isPending} />

          <AuthFooterLink
            prompt="Already have an account?"
            ctaLabel="Sign in"
            onPress={() => router.replace('/(auth)/login')}
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
});
