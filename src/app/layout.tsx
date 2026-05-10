import type { Metadata } from 'next'
import './globals.css'
import { NavLinks } from '@/components/nav-links'

export const metadata: Metadata = {
  title: 'RFQ Agent',
  description: 'Gestor local para operar RFQs, presupuestos y pipeline comercial.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <aside className="side-nav flex flex-col">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--workshop)] text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--workshop)]">RFQ Agent</div>
                  <div className="text-xs font-semibold text-[var(--steel)]">Piloto local</div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4">
              <NavLinks />
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="m-4 rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-medium text-[var(--steel)]">
                Entorno de desarrollo
              </div>
            )}
          </aside>

          <main className="min-w-0 p-5 md:p-10">{children}</main>
        </div>
      </body>
    </html>
  )
}
