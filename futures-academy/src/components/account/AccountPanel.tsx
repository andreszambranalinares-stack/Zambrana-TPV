import { useState } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { ResetAccountModal } from './ResetAccountModal'

export function AccountPanel() {
  const account = useAccountStore()
  const [showReset, setShowReset] = useState(false)

  const equity = account.getEquity()
  const floatingPnL = account.getFloatingPnL()
  const marginUsed = account.getMarginUsed()

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-terminal-text text-sm font-semibold">Cuenta Paper</h3>
        <button
          onClick={() => setShowReset(true)}
          className="text-xs text-terminal-muted hover:text-terminal-text border border-terminal-border rounded px-2 py-1 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-terminal-muted mb-0.5">Balance inicial</div>
          <div className="text-terminal-text font-semibold">${account.initialBalance.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-terminal-muted mb-0.5">Equity</div>
          <div className={`font-semibold ${equity >= account.initialBalance ? 'text-terminal-green' : 'text-terminal-red'}`}>
            ${equity.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-terminal-muted mb-0.5">P&amp;L flotante</div>
          <div className={`font-semibold ${floatingPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {floatingPnL >= 0 ? '+' : ''}{floatingPnL.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-terminal-muted mb-0.5">P&amp;L realizado</div>
          <div className={`font-semibold ${account.realizedPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {account.realizedPnL >= 0 ? '+' : ''}{account.realizedPnL.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-terminal-muted mb-0.5">Margen usado</div>
          <div className="text-terminal-text font-semibold">${marginUsed.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-terminal-muted mb-0.5">Drawdown máx.</div>
          <div className={`font-semibold ${account.maxDrawdown > 10 ? 'text-terminal-red' : 'text-terminal-yellow'}`}>
            {account.maxDrawdown.toFixed(2)}%
          </div>
        </div>
      </div>

      <ResetAccountModal isOpen={showReset} onClose={() => setShowReset(false)} />
    </div>
  )
}
