import { useMarketStore } from '@/store/marketStore'
import { CONTRACT_SPECS } from '@/constants/contracts'

interface SidebarProps {
  currentRoute: string
  onNavigate: (route: string) => void
}

const NAV_ITEMS = [
  { path: 'terminal', label: 'Terminal', icon: '📊' },
  { path: 'cuenta', label: 'Cuenta', icon: '💼' },
  { path: 'diario', label: 'Diario', icon: '📋' },
  { path: 'academia', label: 'Academia', icon: '🎓' },
  { path: 'replay', label: 'Replay', icon: '▶' },
]

export function Sidebar({ currentRoute, onNavigate }: SidebarProps) {
  const { activeSymbol, currentPrices } = useMarketStore()
  const spec = CONTRACT_SPECS[activeSymbol]
  const price = spec ? currentPrices[spec.underlying] : undefined

  return (
    <aside className="w-14 lg:w-48 bg-terminal-surface border-r border-terminal-border flex flex-col shrink-0">
      <div className="p-3 lg:p-4 border-b border-terminal-border">
        <div className="hidden lg:block">
          <h1 className="text-terminal-accent font-semibold text-sm">FuturesAcademy</h1>
          <p className="text-terminal-muted text-xs mt-0.5">Simulador Educativo</p>
        </div>
        <div className="lg:hidden text-terminal-accent font-bold text-lg text-center">FA</div>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 text-sm transition-colors ${
              currentRoute === item.path
                ? 'bg-terminal-accent/10 text-terminal-accent border-r-2 border-terminal-accent'
                : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="hidden lg:block">{item.label}</span>
          </button>
        ))}
      </nav>

      {price && (
        <div className="p-3 lg:p-4 border-t border-terminal-border">
          <div className="hidden lg:block">
            <div className="text-terminal-muted text-xs mb-1">{activeSymbol}</div>
            <div className="text-terminal-green font-semibold text-sm">
              {price.toFixed(2)}
            </div>
          </div>
          <div className="lg:hidden text-center text-terminal-green text-xs font-semibold">
            {price ? price.toFixed(0) : '—'}
          </div>
        </div>
      )}
    </aside>
  )
}
