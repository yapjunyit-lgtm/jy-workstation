import { useState, useEffect } from 'react';
import { useVaultStore } from '../stores/useVaultStore';
import { seedData } from '../lib/seed';
import { SnippetLibrary } from '../components/vault/SnippetLibrary';
import { DataRegistry } from '../components/vault/DataRegistry';
import { CyberMaskChecklist } from '../components/vault/CyberMaskChecklist';
import { PageHeader } from '../components/layout/PageHeader';
import { PillTabs } from '../components/layout/PillTabs';
import { Skeleton } from '../components/layout/Skeleton';

type VaultTab = 'snippets' | 'registry' | 'checklist';

export function VaultPage() {
  const { hydrate, loading } = useVaultStore();
  const [tab, setTab] = useState<VaultTab>('snippets');

  useEffect(() => {
    hydrate();
    seedData(); // Seeds snippets + checklist if DB is empty
  }, []);

  const tabs: { id: VaultTab; label: string }[] = [
    { id: 'snippets', label: 'Snippets' },
    { id: 'registry', label: 'Data Registry' },
    { id: 'checklist', label: 'Cybersecurity' },
  ];

  return (
    <div className="page-enter space-y-6">
      <PageHeader eyebrow="Library" title="Technical " accent="Vault" />

      {/* Tab bar */}
      <PillTabs tabs={tabs.map(({ id, label }) => ({ id, label }))} value={tab} onChange={setTab} />

      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={18} width={160} />
              <Skeleton height={90} />
            </div>
          ))}
        </div>
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
