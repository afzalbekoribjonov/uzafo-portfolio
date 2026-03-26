export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10" style={{borderTopColor:'var(--accent)'}} />
        <p className="text-sm" style={{color:'var(--text-4)'}}>Yuklanmoqda...</p>
      </div>
    </div>
  );
}
