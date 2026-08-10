interface DotsProps {
  size?: number;
  color?: string;
}

export function Dots({ size = 13, color = 'currentColor' }: DotsProps) {
  const d = Math.max(3, size * 0.34);
  return (
    <span className="t-dots inline-flex items-center gap-[2px]" style={{ color }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: d,
            height: d,
            borderRadius: 999,
            background: 'currentColor',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}
