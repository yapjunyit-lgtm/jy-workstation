interface SkeletonProps {
  height?: number;
  width?: number | string;
  radius?: number;
}

export function Skeleton({ height = 14, width = '100%', radius = 10 }: SkeletonProps) {
  return <div className="t-shimmer" style={{ height, width, borderRadius: radius }} />;
}
