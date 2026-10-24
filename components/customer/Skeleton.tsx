// components/customer/Skeleton.tsx — loading placeholder shaped like a card (owner: B)
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-1/3 animate-pulse rounded-tag bg-line" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="h-3 animate-pulse rounded-tag bg-paper" style={{ width: `${90 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}
