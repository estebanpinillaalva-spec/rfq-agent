'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Mail, BarChart2, Settings } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/rfqs', label: 'RFQs', icon: FileText },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/email', label: 'Email', icon: Mail },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-1">
      {nav.map((item) => {
        const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className={`nav-item ${active ? 'nav-item-active' : ''}`}>
            <Icon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
