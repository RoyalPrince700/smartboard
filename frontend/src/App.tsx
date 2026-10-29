import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './stores/authStore';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] text-[15px] text-neutral-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  if (!googleClientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will be unavailable.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
    </GoogleOAuthProvider>
  );
}
