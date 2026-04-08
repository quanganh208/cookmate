/**
 * Tiny pub-sub for auth lifecycle events. Decouples the api-client interceptor (which may emit a
 * logout event on refresh failure) from any UI-level consumer (e.g., root layout navigating to
 * the login screen). Keeping this dependency-free avoids pulling in an event emitter package.
 */

type AuthEvent = 'auth:logout';

type Listener = () => void;

const listeners: Record<AuthEvent, Set<Listener>> = {
  'auth:logout': new Set(),
};

export const authEvents = {
  on(event: AuthEvent, listener: Listener): () => void {
    listeners[event].add(listener);
    return () => listeners[event].delete(listener);
  },

  off(event: AuthEvent, listener: Listener): void {
    listeners[event].delete(listener);
  },

  emit(event: AuthEvent): void {
    listeners[event].forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn(`[auth-events] listener for ${event} threw`, err);
      }
    });
  },
};
