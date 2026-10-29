import { CredentialResponse, GoogleLogin } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled = false }: GoogleSignInButtonProps) {
  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <GoogleLogin
        onSuccess={(response: CredentialResponse) => {
          if (!response.credential) {
            onError?.('No credential returned from Google');
            return;
          }
          void onSuccess(response.credential);
        }}
        onError={() => onError?.('Google sign-in was cancelled or failed')}
        useOneTap={false}
        theme="outline"
        size="large"
        shape="pill"
        text="continue_with"
        width="100%"
      />
    </div>
  );
}
