import type { JournalStats } from '@/store/journalStore'

interface StatCardsProps {
  stats: JournalStats
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: 'green' | 'red' | 'yellow' | 'default'
}) {
  const valueColor =
    color === 'green'
      ? 'text-terminal-green'
      : color === 'red'
      ? 'text-terminal-red'
      : color === 'yellow'
      ? 'text-terminal-yellow'
      : 'text-terminal-text'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3">
      <div className="text-terminal-muted text-xs mb-1">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${valueColor}`}>{value}</div>
      {sub && <div className="text-terminal-muted text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

export function StatCards({ stats }: StatCardsProps) {
  const pf = stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Operaciones"
        value={String(stats.totalTrades)}
        sub={`${stats.wins}G / ${stats.losses}P`}
      />
      <StatCard
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        color={stats.winRate >= 50 ? 'green' : stats.winRate > 0 ? 'yellow' : 'default'}
      />
      <StatCard
        label="Factor de beneficio"
        value={pf}
        color={stats.profitFactor >= 1.5 ? 'green' : stats.profitFactor >= 1 ? 'yellow' : 'red'}
      />
      <StatCard
        label="P&L neto total"
        value={`${stats.totalNetPnL >= 0 ? '+' : ''}$${stats.totalNetPnL.toFixed(2)}`}
        color={stats.totalNetPnL > 0 ? 'green' : stats.totalNetPnL < 0 ? 'red' : 'default'}
      />
      <StatCard
        label="Media ganancia"
        value={`+$${stats.avgProfit.toFixed(2)}`}
        color="green"
      />
      <StatCard
        label="Media pérdida"
        value={`$${stats.avgLoss.toFixed(2)}`}
        color="red"
      />
      <StatCard
        label="Racha actual"
        value={stats.currentStreak === 0 ? '—' : `${stats.currentStreak > 0 ? '+' : ''}${stats.currentStreak}`}
        sub={`Máx. gan: ${stats.maxWinStreak} · Máx. pér: ${stats.maxLossStreak}`}
        color={stats.currentStreak > 0 ? 'green' : stats.currentStreak < 0 ? 'red' : 'default'}
      />
      <StatCard
        label="Operaciones ganadoras"
        value={`${stats.wins}`}
        sub={`de ${stats.totalTrades} total`}
        color={stats.wins > stats.losses ? 'green' : 'default'}
      />
    </div>
  )
}
