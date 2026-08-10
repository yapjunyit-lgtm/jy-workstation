import { Lock } from 'lucide-react';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
      <div className="text-center">
        <div className="text-5xl mb-6 opacity-30">
          <Lock size={48} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          JY Workstation is locked
        </p>
        <button className="btn-sakura btn-primary" onClick={onUnlock}>
          Unlock
        </button>
      </div>
    </div>
  );
}
