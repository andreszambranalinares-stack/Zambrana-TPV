import { AccountPanel } from '@/components/account/AccountPanel'
import { useAccountStore } from '@/store/accountStore'

export function AccountPage() {
  const { closedTrades, realizedPnL, maxDrawdown } = useAccountStore()

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-terminal-text mb-4">Cuenta Paper</h2>
      <AccountPanel />

      <div className="mt-4 bg-terminal-surface border border-terminal-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-terminal-text mb-3">Resumen histórico</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-terminal-muted mb-1">Total operaciones</div>
            <div className="text-terminal-text font-semibold">{closedTrades.length}</div>
          </div>
          <div>
            <div className="text-terminal-muted mb-1">P&amp;L neto total</div>
            <div className={`font-semibold ${realizedPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {realizedPnL >= 0 ? '+' : ''}{realizedPnL.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-terminal-muted mb-1">Drawdown máximo</div>
            <div className={`font-semibold ${maxDrawdown > 10 ? 'text-terminal-red' : 'text-terminal-yellow'}`}>
              {maxDrawdown.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-terminal-muted mb-1">Operaciones ganadoras</div>
            <div className="text-terminal-green font-semibold">
              {closedTrades.filter((t) => t.netPnL > 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
