import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleGoogleSuccess = async (credential: string) => {
    clearError();
    await loginWithGoogle(credential);
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex h-full overflow-y-auto items-center justify-center bg-[#f5f5f7] px-5 py-12 text-neutral-900 antialiased">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-neutral-900 text-[14px] font-semibold tracking-tight text-white">
            SB
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">
            Welcome to Smart Board
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
            Sign in to save your boards, sync sessions across devices, and pick up where you left off.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <GoogleSignInButton
          disabled={loading}
          onSuccess={handleGoogleSuccess}
          onError={(message) => useAuthStore.setState({ error: message })}
        />

        <p className="mt-6 text-center text-[13px] leading-relaxed text-neutral-500">
          New here? Google sign-in creates your account automatically.
        </p>

        <div className="mt-8 border-t border-neutral-200 pt-6 text-center">
          <Link
            to="/"
            className="text-[14px] font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Continue without signing in
          </Link>
        </div>
      </div>
    </div>
  );
}
