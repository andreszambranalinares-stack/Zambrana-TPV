import { Component, type ReactNode } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { useJournalStats } from '@/store/journalStore'
import { StatCards } from '@/components/journal/StatCards'
import { EquityCurveChart } from '@/components/journal/EquityCurveChart'
import { TradeRow } from '@/components/journal/TradeRow'

// Error boundary to prevent the whole page from crashing if lightweight-charts
// or a bad localStorage entry causes an unhandled exception.
class JournalErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown) {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-terminal-surface border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-400 text-sm font-semibold mb-1">Error al cargar el diario</p>
          <p className="text-terminal-muted text-xs mb-4 font-mono">{this.state.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: '' })
              this.props.onReset()
            }}
            className="px-4 py-1.5 bg-terminal-accent hover:bg-blue-400 rounded text-white text-xs font-semibold transition-colors"
          >
            Restablecer datos del diario
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function JournalContent() {
  const closedTrades = useAccountStore((s) => s.closedTrades)
  const initialBalance = useAccountStore((s) => s.initialBalance)
  const resetAccount = useAccountStore((s) => s.resetAccount)
  const stats = useJournalStats()

  const sorted = [...closedTrades].sort((a, b) => b.closedAt - a.closedAt)

  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-lg font-semibold text-terminal-text mb-4">Diario de Operaciones</h2>

      <StatCards stats={stats} />

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-terminal-text mb-3">Curva de Equity</h3>
        <EquityCurveChart key={stats.totalTrades} stats={stats} initialBalance={initialBalance} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-terminal-text">
            Historial ({closedTrades.length} operaciones)
          </h3>
        </div>

        {closedTrades.length === 0 ? (
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8 text-center">
            <p className="text-terminal-muted text-sm">Sin operaciones registradas.</p>
            <p className="text-terminal-muted text-xs mt-2">Ve al Terminal y cierra tu primera operación.</p>
          </div>
        ) : (
          <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border text-terminal-muted text-xs">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Símbolo</th>
                  <th className="text-left p-2">Dir.</th>
                  <th className="text-right p-2">Entrada</th>
                  <th className="text-right p-2">Salida</th>
                  <th className="text-right p-2">Fecha cierre</th>
                  <th className="text-right p-2">Duración</th>
                  <th className="text-right p-2">Motivo</th>
                  <th className="text-right p-2">P&L neto</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((trade, i) => (
                  <TradeRow key={trade.id} trade={trade} index={sorted.length - 1 - i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function JournalPage() {
  const resetAccount = useAccountStore((s) => s.resetAccount)
  return (
    <JournalErrorBoundary onReset={() => resetAccount()}>
      <JournalContent />
    </JournalErrorBoundary>
  )
}
