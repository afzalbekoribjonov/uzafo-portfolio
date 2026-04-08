'use client';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-slate-950 text-white" suppressHydrationWarning>
        <main className="grid min-h-screen place-items-center px-6">
          <div className="max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Error</p>
            <h1 className="mt-4 text-4xl font-semibold">Something went wrong</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">{error.message}</p>
            <button
              type="button"
              className="mt-8 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
              onClick={() => reset()}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
