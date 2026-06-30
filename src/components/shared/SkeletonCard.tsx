export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
      <div className="relative overflow-hidden aspect-video" style={{ background: '#162F3E' }}>
        <div className="sk-sweep" />
      </div>
      <div className="px-[15px] py-[13px] space-y-[7px]">
        {[80, 60, 40].map(w => (
          <div
            key={w}
            className="relative overflow-hidden rounded-[6px] h-[11px]"
            style={{ width: `${w}%`, background: '#162F3E' }}
          >
            <div className="sk-sweep" />
          </div>
        ))}
      </div>
    </div>
  )
}
