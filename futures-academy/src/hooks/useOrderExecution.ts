import { useEffect } from 'react'
import { useMarketStore } from '@/store/marketStore'
import { useAccountStore } from '@/store/accountStore'
import { executeOrders } from '@/services/orderExecutor'
import { CONTRACT_SPECS } from '@/constants/contracts'

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

      // Phase 2 uses market orders only — no pending order queue yet
      const equity = account.getEquity()
      const result = executeOrders([], underlyingPositions, price, equity)

      // Process SL/TP/liquidation closings
      for (const { position, exitPrice, reason } of result.closedPositions) {
        account.updateFloatingPnL({ [underlying]: exitPrice })
        account.closePosition(position.id, exitPrice, reason)
      }

      // Check liquidation
      if (result.shouldTriggerLiquidation) {
        account.liquidateAll(price, underlying)
      }
    }

    // Update floating P&L for all positions
    account.updateFloatingPnL(currentPrices as Record<string, number>)
  }, [currentPrices]) // eslint-disable-line react-hooks/exhaustive-deps
}
