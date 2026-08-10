import { useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';

/**
 * Project identity header — centered, Times New Roman, shown at the top
 * of the dashboard (the app's "first page").
 */
export function ProjectHeader() {
  const { info, hydrate } = useProjectStore();

  useEffect(() => {
    hydrate(true);
  }, []);

  if (!info.name) return null;

  return (
    <div style={{ textAlign: 'center', fontFamily: "'Times New Roman', Times, serif", padding: '8px 0 4px' }}>
      <h1
        style={{
          fontSize: 38,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {info.name}
      </h1>
      {info.description && (
        <p
          style={{
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            margin: '6px 0 2px',
            maxWidth: 640,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {info.description}
        </p>
      )}
      {info.author && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          by {info.author}
        </p>
      )}
    </div>
  );
}
