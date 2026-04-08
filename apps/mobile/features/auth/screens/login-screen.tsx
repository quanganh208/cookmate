import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import { AuthFormField } from '../components/auth-form-field';
import { AuthSubmitButton } from '../components/auth-submit-button';
import { AuthHeader } from '../components/auth-header';
import { AuthFooterLink } from '../components/auth-footer-link';
import { AuthErrorBanner } from '../components/auth-error-banner';
import { GoogleSignInButton } from '../components/google-sign-in-button';
import { loginSchema, type LoginFormValues } from '../validation/auth-schemas';
import { useLoginMutation } from '../hooks/use-login-mutation';
import { useGoogleLogin, GoogleSignInCancelledError } from '../hooks/use-google-login';
import { mapAuthError } from '../utils/error-mapper';

export function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useLoginMutation();
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

  const onSubmit = (values: LoginFormValues) => {
    setSubmitError(null);
    loginMutation.mutate(values, {
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
            title="Welcome back"
            subtitle="Sign in to keep exploring your favorite recipes."
          />

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

          <AuthFormField
            control={control}
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            errorMessage={errors.password?.message}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={8}
            style={styles.forgotPasswordWrapper}
          >
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </Pressable>

          <AuthSubmitButton
            label="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
          />

          <GoogleSignInButton onPress={onGoogleSignIn} loading={googleLoginMutation.isPending} />

          <AuthFooterLink
            prompt="Don't have an account?"
            ctaLabel="Sign up"
            onPress={() => router.replace('/(auth)/register')}
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
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPassword: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.primary,
  },
});
