import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-neutral-200', className)} />
  );
}

export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <Skeleton className={cn('h-4', width)} />;
}

export function SkeletonAvatar({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8', default: 'w-10 h-10', lg: 'w-16 h-16' };
  return <Skeleton className={cn('rounded-full', sizes[size])} />;
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-3/5" />
        <SkeletonLine width="w-2/5" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <SkeletonLine width="w-2/3" />
      <div className="mt-3 space-y-2">
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-2/5" />
            <SkeletonLine width="w-1/3" />
          </div>
          <SkeletonLine width="w-16" />
        </div>
      ))}
    </div>
  );
}
