export function DashboardPage() {
  return (
    <div className="page-enter space-y-8">
      <div className="card-static">
        <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          👋 Welcome to your Dashboard
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Daily priorities, scratchpad, blockers, and Pomodoro timer will appear here.
        </p>
      </div>
    </div>
  );
}
