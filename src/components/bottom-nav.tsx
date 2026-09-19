import { Link } from '@tanstack/react-router'
import { CalendarCheck, PiggyBank, Wrench, ClipboardList } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Hoje', icon: CalendarCheck },
  { to: '/projetos', label: 'Projetos', icon: ClipboardList },
  { to: '/ferramentas', label: 'Ferramentas', icon: Wrench },
  { to: '/painel', label: 'Painel', icon: PiggyBank },
] as const

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-muted-foreground data-[status=active]:text-primary"
              activeOptions={{ exact: to === '/' }}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
