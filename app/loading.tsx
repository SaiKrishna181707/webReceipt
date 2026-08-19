export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse" aria-label="Loading WebReceipt">
      <div className="space-y-2">
        <div className="h-3 w-40 bg-purple-500/20 rounded" />
        <div className="h-8 w-64 bg-white/10 rounded-lg" />
        <div className="h-4 w-96 bg-white/5 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((x) => (
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3" key={x}>
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-8 w-16 bg-white/20 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-white/[0.03] border border-white/10 p-6" />
        <div className="h-72 rounded-2xl bg-white/[0.03] border border-white/10 p-6" />
      </div>
    </div>
  )
}
