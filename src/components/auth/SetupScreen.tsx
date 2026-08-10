import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

export function SetupScreen() {
  const { setup, error, isLoading, clearError } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (passphrase.length < 8) {
      setLocalError('Passphrase must be at least 8 characters');
      return;
    }
    if (passphrase !== confirm) {
      setLocalError('Passphrases do not match');
      return;
    }

    await setup(passphrase);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="card-static text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome to JY Workstation
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Set a passphrase to secure your workspace. Your data never leaves this device.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setLocalError(''); clearError(); }}
              placeholder="Create passphrase (min 8 characters)"
              className="input-sakura mb-3 text-center"
              autoFocus
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setLocalError(''); clearError(); }}
              placeholder="Confirm passphrase"
              className="input-sakura mb-3 text-center"
              autoComplete="new-password"
            />
            {displayError && (
              <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{displayError}</p>
            )}
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Your passphrase is used to derive an encryption key. It is never stored anywhere.
              If you forget it, your data cannot be recovered.
            </p>
            <button
              type="submit"
              className="btn-sakura btn-primary w-full"
              disabled={isLoading || passphrase.length < 8 || !confirm}
            >
              {isLoading ? 'Setting up...' : 'Create Workspace →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
