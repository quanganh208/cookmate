export { authRepository } from './api/auth-repository';
export { useAuthStore } from './store';
export type { AuthStatus } from './store';

export { UserAvatar } from './components/user-avatar';

export { LoginScreen } from './screens/login-screen';
export { RegisterScreen } from './screens/register-screen';

export { useLoginMutation } from './hooks/use-login-mutation';
export { useRegisterMutation } from './hooks/use-register-mutation';

export { mapAuthError } from './utils/error-mapper';
export { loginSchema, registerSchema } from './validation/auth-schemas';
export type { LoginFormValues, RegisterFormValues } from './validation/auth-schemas';

export type {
  AuthUser,
  AuthProvider,
  Session,
  AuthResponsePayload,
  LoginCredentials,
  RegisterCredentials,
  GoogleCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from './types';
