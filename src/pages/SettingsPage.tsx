export function SettingsPage() {
  return (
    <div className="page-enter space-y-8">
      <div className="card-static">
        <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          ⚙️ Settings
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Auth, sync, backup, and preferences will be configured here.
        </p>
      </div>
    </div>
  );
}
