import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { shouldAutoFocus } from '../../lib/utils';

export function LoginScreen() {
  const { login, error, isLoading, clearError } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) return;
    await login(passphrase);
    setPassphrase('');
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="card-static text-center">
          <div className="mx-auto mb-4 grid place-items-center rounded-full" style={{ width: 44, height: 44, background: "var(--text)", color: "var(--bg)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, fontWeight: 600 }}>J</div>
          <h1 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            JY Workstation
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Enter your passphrase to unlock
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); clearError(); }}
              placeholder="Enter passphrase"
              className="input-sakura mb-3 text-center"
              autoFocus={shouldAutoFocus()}
              autoComplete="current-password"
              aria-label="Passphrase"
            />
            {error && (
              <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{error}</p>
            )}
            <button
              type="submit"
              className="btn-sakura btn-primary w-full"
              disabled={isLoading || passphrase.length < 8}
            >
              {isLoading ? 'Unlocking…' : 'Unlock →'}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>
          Session auto-locks after 7 days
        </p>
      </div>
    </div>
  );
}
