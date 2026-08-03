import { useState, useEffect } from 'react';
import { useVaultStore } from '../stores/useVaultStore';
import { seedData } from '../lib/seed';
import { SnippetLibrary } from '../components/vault/SnippetLibrary';
import { DataRegistry } from '../components/vault/DataRegistry';
import { CyberMaskChecklist } from '../components/vault/CyberMaskChecklist';

type VaultTab = 'snippets' | 'registry' | 'checklist';

export function VaultPage() {
  const { hydrate, loading } = useVaultStore();
  const [tab, setTab] = useState<VaultTab>('snippets');

  useEffect(() => {
    hydrate();
    seedData(); // Seeds snippets + checklist if DB is empty
  }, []);

  const tabs: { id: VaultTab; label: string; emoji: string }[] = [
    { id: 'snippets', label: 'Snippets', emoji: '📋' },
    { id: 'registry', label: 'Data Registry', emoji: '🗄️' },
    { id: 'checklist', label: 'Cybersecurity', emoji: '🔒' },
  ];

  return (
    <div className="page-enter space-y-6">
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        📚 Technical Vault
      </h2>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b pb-0" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm transition-soft border-b-2 -mb-px"
            style={{
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              fontWeight: tab === t.id ? 450 : 400,
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading vault...</p>
      ) : (
        <>
          {tab === 'snippets' && <SnippetLibrary />}
          {tab === 'registry' && <DataRegistry />}
          {tab === 'checklist' && <CyberMaskChecklist />}
        </>
      )}
    </div>
  );
}
