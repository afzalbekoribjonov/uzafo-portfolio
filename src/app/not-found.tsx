export default function RootNotFound() {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        style={{margin: 0, background: '#020617', color: 'white', fontFamily: 'sans-serif'}}
        suppressHydrationWarning
      >
        <main style={{minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px'}}>
          <div style={{maxWidth: 560, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 32, background: 'rgba(255,255,255,0.04)'}}>
            <p style={{color: '#67e8f9', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: 12, fontWeight: 700}}>404</p>
            <h1 style={{fontSize: 40, marginTop: 16}}>Page not found</h1>
            <p style={{lineHeight: 1.8, color: '#cbd5e1'}}>This route does not exist. Try going to <a href="/" style={{color: '#67e8f9'}}>the homepage</a>.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
