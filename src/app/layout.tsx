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
            <div className="p-6">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-workshop">RFQ Agent</div>
              <div className="mt-2 text-2xl font-black text-ink">Gestor local</div>
              <p className="mt-3 text-sm leading-6 text-steel">
                Cabina privada para operar pilotos, revisar borradores y preparar demos.
              </p>
            </div>

            <div className="flex-1 px-4">
              <NavLinks />
            </div>

            <div className="m-5 rounded-lg border border-[#ded6ca] bg-[#fffdf8] p-4 text-xs leading-5 text-steel">
              Modo seguro: los envios reales estan bloqueados. Resend solo manda a{' '}
              <span className="font-bold">TEST_EMAIL_TO</span>.
            </div>
          </aside>

          <main className="min-w-0 p-5 md:p-10">{children}</main>
        </div>
      </body>
    </html>
  )
}
