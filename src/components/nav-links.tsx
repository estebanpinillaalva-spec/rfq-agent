'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/dashboard/rfqs', label: 'RFQs' },
  { href: '/dashboard/clientes', label: 'Clientes' },
  { href: '/dashboard/email', label: 'Email' },
  { href: '/dashboard/pipeline', label: 'Pipeline' },
  { href: '/dashboard/settings', label: 'Ajustes' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-2">
      {nav.map((item) => {
        const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} className={`nav-item ${active ? 'nav-item-active' : ''}`}>
            <span className="nav-dot" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
