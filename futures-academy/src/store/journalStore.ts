import { useMemo } from 'react'
import { useAccountStore } from './accountStore'
import type { ClosedTrade } from '@/types'

export interface JournalStats {
  totalTrades: number
  wins: number
  losses: number
  winRate: number           // 0–100 %
  avgProfit: number         // avg net P&L on winning trades
  avgLoss: number           // avg net P&L on losing trades (negative)
  profitFactor: number      // totalProfit / |totalLoss|, or Infinity if no losses
  currentStreak: number     // positive = consecutive wins, negative = consecutive losses
  maxWinStreak: number
  maxLossStreak: number
  totalNetPnL: number
  equityCurve: Array<{ time: number; value: number }> // time in seconds, value = equity
}

export function calcJournalStats(
  trades: ClosedTrade[],
  initialBalance: number,
): JournalStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgProfit: 0,
      avgLoss: 0,
      profitFactor: 0,
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      totalNetPnL: 0,
      equityCurve: [],
    }
  }

  const sorted = [...trades].sort((a, b) => a.closedAt - b.closedAt)
  const wins = sorted.filter((t) => t.netPnL > 0)
  const losses = sorted.filter((t) => t.netPnL <= 0)

  const totalProfit = wins.reduce((s, t) => s + t.netPnL, 0)
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.netPnL, 0))
  const profitFactor = totalLoss === 0 ? (totalProfit > 0 ? Infinity : 0) : totalProfit / totalLoss

  // Streak calculation
  let currentStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0
  let streak = 0

  for (const trade of sorted) {
    if (trade.netPnL > 0) {
      streak = streak > 0 ? streak + 1 : 1
    } else {
      streak = streak < 0 ? streak - 1 : -1
    }
    if (streak > maxWinStreak) maxWinStreak = streak
    if (streak < -maxLossStreak) maxLossStreak = -streak
    currentStreak = streak
  }

  // Equity curve: starting balance + cumulative netPnL per trade.
  // Timestamps must be strictly increasing — two trades closing in the same
  // second would cause lightweight-charts to throw. Bump by 1s when needed.
  let cumulative = 0
  let lastTime = -1
  const equityCurve = sorted.map((t) => {
    cumulative += t.netPnL
    let time = Math.floor(t.closedAt / 1000)
    if (time <= lastTime) time = lastTime + 1
    lastTime = time
    return { time, value: initialBalance + cumulative }
  })

  // Prepend the starting point (always 1s before the first trade point)
  if (sorted.length > 0) {
    equityCurve.unshift({
      time: equityCurve[0].time - 1,
      value: initialBalance,
    })
  }

  return {
    totalTrades: sorted.length,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / sorted.length) * 100,
    avgProfit: wins.length > 0 ? totalProfit / wins.length : 0,
    avgLoss: losses.length > 0 ? -(totalLoss / losses.length) : 0,
    profitFactor,
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    totalNetPnL: totalProfit - totalLoss,
    equityCurve,
  }
}

export function useJournalStats(): JournalStats {
  // Use separate scalar selectors to avoid creating new objects on every render,
  // which would cause Zustand to re-render on every store update.
  const closedTrades = useAccountStore((s) => s.closedTrades)
  const initialBalance = useAccountStore((s) => s.initialBalance)
  return useMemo(() => calcJournalStats(closedTrades, initialBalance), [closedTrades, initialBalance])
}
