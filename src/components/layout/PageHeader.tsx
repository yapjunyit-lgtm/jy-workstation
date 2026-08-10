import { type ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  accent: string; // one italic serif word inside the title
  children?: ReactNode; // right-side actions
}

export function PageHeader({ eyebrow, title, accent, children }: PageHeaderProps) {
  const parts = title.split(accent);
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 t-reveal is-in">
      <div>
        <span className="meta-label">{eyebrow}</span>
        <h2 className="mt-1 text-[28px] font-bold tracking-tight leading-none" style={{ color: 'var(--text)' }}>
          {parts[0]}
          <span className="serif-accent" style={{ color: 'var(--accent)' }}>{accent}</span>
          {parts[1] ?? ''}
        </h2>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
