import type { Order, Position, ClosedTrade } from '@/types'
import {
  calcMaintenanceMargin,
  shouldLiquidate,
  roundToTick,
  getSpec,
} from './futuresEngine'

export interface ExecutorResult {
  filledOrders: Array<{ order: Order; fillPrice: number }>
  closedPositions: Array<{ position: Position; exitPrice: number; reason: ClosedTrade['closeReason'] }>
  shouldTriggerLiquidation: boolean
}

export function executeOrders(
  pendingOrders: Order[],
  openPositions: Position[],
  currentPrice: number,
  equity: number,
): ExecutorResult {
  const result: ExecutorResult = {
    filledOrders: [],
    closedPositions: [],
    shouldTriggerLiquidation: false,
  }

  // 1. Process pending orders
  for (const order of pendingOrders) {
    if (order.status !== 'PENDING') continue

    let fillPrice: number | null = null

    if (order.type === 'MARKET') {
      // 1 tick slippage
      const spec = getSpec(order.symbol)
      const slippage = spec.tickSize * (order.side === 'BUY' ? 1 : -1)
      fillPrice = roundToTick(currentPrice + slippage, spec.tickSize)
    } else if (order.type === 'LIMIT') {
      if (order.side === 'BUY' && currentPrice <= order.limitPrice!) {
        fillPrice = order.limitPrice!
      } else if (order.side === 'SELL' && currentPrice >= order.limitPrice!) {
        fillPrice = order.limitPrice!
      }
    } else if (order.type === 'STOP') {
      if (order.side === 'BUY' && currentPrice >= order.stopPrice!) {
        fillPrice = currentPrice
      } else if (order.side === 'SELL' && currentPrice <= order.stopPrice!) {
        fillPrice = currentPrice
      }
    }

    if (fillPrice !== null) {
      result.filledOrders.push({ order, fillPrice })
    }
  }

  // 2. Check SL/TP on open positions
  for (const position of openPositions) {
    const isLong = position.side === 'BUY'

    // SL check
    const slHit = isLong
      ? currentPrice <= position.slPrice
      : currentPrice >= position.slPrice

    if (slHit) {
      result.closedPositions.push({ position, exitPrice: position.slPrice, reason: 'SL' })
      continue
    }

    // TP check
    if (position.tpPrice) {
      const tpHit = isLong
        ? currentPrice >= position.tpPrice
        : currentPrice <= position.tpPrice

      if (tpHit) {
        result.closedPositions.push({ position, exitPrice: position.tpPrice, reason: 'TP' })
        continue
      }
    }
  }

  // 3. Check liquidation
  const totalMaintMargin = openPositions.reduce(
    (sum, p) => sum + calcMaintenanceMargin(p.symbol, p.size),
    0,
  )
  if (openPositions.length > 0 && shouldLiquidate(equity, totalMaintMargin)) {
    result.shouldTriggerLiquidation = true
  }

  return result
}
