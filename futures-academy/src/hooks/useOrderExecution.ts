import { useEffect } from 'react'
import { useMarketStore } from '@/store/marketStore'
import { useAccountStore } from '@/store/accountStore'
import { executeOrders } from '@/services/orderExecutor'
import { CONTRACT_SPECS } from '@/constants/contracts'

const underlyingMap: Record<string, string> = {
  MNQ: 'NQ100',
  NQ: 'NQ100',
  MES: 'SP500',
  ES: 'SP500',
}

// This hook subscribes to price changes and runs the order executor
export function useOrderExecution() {
  const currentPrices = useMarketStore((s) => s.currentPrices)
  const account = useAccountStore()

  useEffect(() => {
    // Run the executor for each underlying
    for (const [underlying, price] of Object.entries(currentPrices)) {
      if (!price) continue

      // Get positions for this underlying
      const underlyingPositions = account.openPositions.filter((p) => {
        const spec = CONTRACT_SPECS[p.symbol]
        return spec?.underlying === underlying
      })

      // Phase 2/3 uses market orders only — no pending order queue yet
      const equity = account.getEquity()
      const result = executeOrders([], underlyingPositions, price, equity)

      // Process SL/TP closings — update floating P&L FIRST so exit price is
      // correctly reflected in the trade record before closePosition records it
      for (const { position, exitPrice, reason } of result.closedPositions) {
        account.updateFloatingPnL({ [underlying]: exitPrice })
        account.closePosition(position.id, exitPrice, reason)
      }

      // Check liquidation — runs before the general floating P&L update so
      // liquidation uses the current price snapshot
      if (result.shouldTriggerLiquidation) {
        account.liquidateAll(price, underlying)
      }
    }

    // Update floating P&L for all positions with latest prices
    account.updateFloatingPnL(currentPrices as Record<string, number>)
  }, [currentPrices]) // eslint-disable-line react-hooks/exhaustive-deps

  // Suppress unused variable warning — underlyingMap used above at module level
  void underlyingMap
}
