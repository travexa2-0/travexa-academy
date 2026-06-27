export default function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-surface animate-pulse">
      <div className="aspect-[16/9] bg-surface-card" />
      <div className="bg-brand-navy-2 p-4 space-y-2">
        <div className="h-4 bg-surface-card rounded w-3/4" />
        <div className="h-3 bg-surface-card rounded w-1/2" />
        <div className="h-3 bg-surface-card rounded w-1/4 mt-2" />
      </div>
    </div>
  )
}
