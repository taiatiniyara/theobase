import { type HTMLAttributes } from "react";

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className = "",
  ...props
}: { rows?: number; cols?: number } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg bg-white shadow ${className}`} {...props}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <SkeletonBar className="h-4 w-24" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonBar key={j} className={`h-4 ${j === 0 ? "w-32" : "w-20"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow ${className}`} {...props}>
      <SkeletonBar className="mb-3 h-3 w-20" />
      <SkeletonBar className="h-6 w-24" />
    </div>
  );
}

export function FormSkeleton({
  fields = 4,
  className = "",
  ...props
}: { fields?: number } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBar className="mb-1 h-3 w-16" />
          <SkeletonBar className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      <SkeletonBar className="mb-2 h-7 w-48" />
      <SkeletonBar className="mb-6 h-4 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </div>
  );
}
