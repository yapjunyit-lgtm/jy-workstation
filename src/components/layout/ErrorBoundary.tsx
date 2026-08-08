import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Global error boundary: shows the error on screen instead of a blank page.
 * Also installs window error listeners so uncaught async errors are visible.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: '#F7F4EF' }}
        >
          <div className="card-static max-w-md w-full space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Something went wrong
              </h2>
            </div>
            <p className="text-xs font-mono break-all" style={{ color: 'var(--danger)' }}>
              {this.state.error.message || String(this.state.error)}
            </p>
            <pre className="text-[10px] font-mono max-h-40 overflow-auto p-2 rounded"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              {this.state.error.stack || ''}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.hash = '#/'; window.location.reload(); }}
              className="btn-sakura btn-primary btn-sm"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function installGlobalErrorReporter(): void {
  const mount = () => {
    const el = document.createElement('div');
    el.id = 'jy-global-error';
    el.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:100000;background:#F3E4E0;color:#C4887C;' +
      'font:12px/1.5 monospace;padding:8px 14px;display:none;border-bottom:1px solid #E5E0D9;' +
      'word-break:break-all;white-space:pre-wrap;max-height:40vh;overflow:auto;';
    document.body.appendChild(el);
  };
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  const show = (msg: string) => {
    const el = document.getElementById('jy-global-error');
    if (el) {
      el.textContent = `⚠ ${msg}`;
      el.style.display = 'block';
    }
  };

  const KNOWN_BENIGN = [
    'Database is closing/hidden', // Firebase Auth closes IDB when tab is hidden
  ];
  const isBenign = (msg: string) => KNOWN_BENIGN.some((k) => msg.includes(k));

  window.addEventListener('error', (e) => {
    if (e.message && isBenign(e.message)) return;
    show(e.message || 'Uncaught error');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string } | undefined;
    const msg = r?.message ? `Promise: ${r.message}` : 'Unhandled promise rejection';
    if (isBenign(msg)) return;
    show(msg);
  });
}
