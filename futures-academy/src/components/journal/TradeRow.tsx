import type { ClosedTrade } from '@/types'

interface TradeRowProps {
  trade: ClosedTrade
  index: number
}

const REASON_LABELS: Record<string, string> = {
  SL: 'Stop Loss',
  TP: 'Take Profit',
  MANUAL: 'Manual',
  LIQUIDATION: 'Liquidación',
}

export function TradeRow({ trade, index }: TradeRowProps) {
  const isWin = trade.netPnL > 0
  const date = new Date(trade.closedAt)
  const duration = Math.round((trade.closedAt - trade.openedAt) / 60000)

  return (
    <tr className="border-b border-terminal-border/50 hover:bg-white/5 text-xs">
      <td className="p-2 text-terminal-muted">{index + 1}</td>
      <td className="p-2 font-semibold text-terminal-accent">{trade.symbol}</td>
      <td className={`p-2 font-semibold ${trade.side === 'BUY' ? 'text-terminal-green' : 'text-terminal-red'}`}>
        {trade.side === 'BUY' ? 'LARGO' : 'CORTO'}
      </td>
      <td className="p-2 text-right text-terminal-text tabular-nums">{trade.entryPrice.toFixed(2)}</td>
      <td className="p-2 text-right text-terminal-text tabular-nums">{trade.exitPrice.toFixed(2)}</td>
      <td className="p-2 text-right text-terminal-muted">
        {date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}{' '}
        {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="p-2 text-right text-terminal-muted">{duration}m</td>
      <td className="p-2 text-right">
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          trade.closeReason === 'SL' ? 'bg-red-900/40 text-red-300' :
          trade.closeReason === 'TP' ? 'bg-green-900/40 text-green-300' :
          trade.closeReason === 'LIQUIDATION' ? 'bg-red-900/60 text-red-200' :
          'bg-terminal-bg text-terminal-muted'
        }`}>
          {REASON_LABELS[trade.closeReason]}
        </span>
      </td>
      <td className={`p-2 text-right font-semibold tabular-nums ${isWin ? 'text-terminal-green' : 'text-terminal-red'}`}>
        {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toFixed(2)}
      </td>
    </tr>
  )
}
