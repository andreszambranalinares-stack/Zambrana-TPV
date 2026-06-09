const NAV_ITEMS = [
  { path: 'terminal', label: 'Terminal', icon: '📊' },
  { path: 'cuenta', label: 'Cuenta', icon: '💼' },
  { path: 'diario', label: 'Diario', icon: '📋' },
  { path: 'academia', label: 'Academia', icon: '🎓' },
  { path: 'replay', label: 'Replay', icon: '▶' },
]

interface MobileNavProps {
  currentRoute: string
  onNavigate: (route: string) => void
}

export function MobileNav({ currentRoute, onNavigate }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-terminal-surface border-t border-terminal-border z-50">
      <div className="flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors ${
              currentRoute === item.path
                ? 'text-terminal-accent'
                : 'text-terminal-muted'
            }`}
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
