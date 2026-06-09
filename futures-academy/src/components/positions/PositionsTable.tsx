import { useAccountStore } from '@/store/accountStore'
import { useMarketStore } from '@/store/marketStore'
import { CONTRACT_SPECS } from '@/constants/contracts'

export function PositionsTable() {
  const { openPositions, closePosition, updateFloatingPnL } = useAccountStore()
  const { currentPrices } = useMarketStore()

  function handleClose(positionId: string, symbol: string) {
    const spec = CONTRACT_SPECS[symbol]
    if (!spec) return
    const price = currentPrices[spec.underlying]
    if (!price) return
    updateFloatingPnL(currentPrices as Record<string, number>)
    closePosition(positionId, price, 'MANUAL')
  }

  if (openPositions.length === 0) {
    return (
      <div className="p-4 text-center text-terminal-muted text-sm">
        Sin posiciones abiertas
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-terminal-border text-terminal-muted">
            <th className="text-left p-2">Símbolo</th>
            <th className="text-left p-2">Dir.</th>
            <th className="text-right p-2">Contratos</th>
            <th className="text-right p-2">Entrada</th>
            <th className="text-right p-2">SL</th>
            <th className="text-right p-2">P&amp;L</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {openPositions.map((pos) => (
            <tr key={pos.id} className="border-b border-terminal-border/50 hover:bg-white/5">
              <td className="p-2 font-semibold text-terminal-accent">{pos.symbol}</td>
              <td className={`p-2 font-semibold ${pos.side === 'BUY' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {pos.side === 'BUY' ? 'LARGO' : 'CORTO'}
              </td>
              <td className="p-2 text-right text-terminal-text">{pos.size}</td>
              <td className="p-2 text-right text-terminal-text tabular-nums">{pos.entryPrice.toFixed(2)}</td>
              <td className="p-2 text-right text-terminal-red tabular-nums">{pos.slPrice.toFixed(2)}</td>
              <td className={`p-2 text-right font-semibold tabular-nums ${pos.floatingPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {pos.floatingPnL >= 0 ? '+' : ''}{pos.floatingPnL.toFixed(2)}
              </td>
              <td className="p-2">
                <button
                  onClick={() => handleClose(pos.id, pos.symbol)}
                  className="px-2 py-1 text-xs border border-terminal-border rounded hover:border-terminal-red hover:text-terminal-red transition-colors text-terminal-muted"
                >
                  Cerrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
