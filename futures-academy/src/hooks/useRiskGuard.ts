import { calcRiskDollars, calcRiskPercent } from '@/services/futuresEngine'
import { useAccountStore } from '@/store/accountStore'
import type { OrderSide, ContractSymbol } from '@/types'

export const RISK_THRESHOLD_PERCENT = 2

export function useRiskGuard() {
  const getEquity = useAccountStore((s) => s.getEquity)

  function checkRisk(
    side: OrderSide,
    estimatedEntry: number,
    slPrice: number,
    symbol: ContractSymbol,
    size: number,
  ): { riskDollars: number; riskPercent: number; isHighRisk: boolean } {
    const equity = getEquity()
    const riskDollars = calcRiskDollars(side, estimatedEntry, slPrice, symbol, size)
    const riskPercent = calcRiskPercent(riskDollars, equity)
    return {
      riskDollars,
      riskPercent,
      isHighRisk: riskPercent > RISK_THRESHOLD_PERCENT,
    }
  }

  return { checkRisk }
}
