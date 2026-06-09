import type { ContractSpec, Position, OrderSide, ContractSymbol } from '@/types'
import { CONTRACT_SPECS } from '@/constants/contracts'

export function getSpec(symbol: string): ContractSpec {
  const spec = CONTRACT_SPECS[symbol]
  if (!spec) throw new Error(`Unknown contract: ${symbol}`)
  return spec
}

export function roundToTick(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize
}

export function calcFloatingPnL(position: Position, currentPrice: number): number {
  const spec = getSpec(position.symbol)
  const direction = position.side === 'BUY' ? 1 : -1
  const pointDiff = (currentPrice - position.entryPrice) * direction
  return pointDiff * spec.pointValue * position.size
}

export function calcNetPnL(grossPnL: number, commission: number): number {
  return grossPnL - commission
}

export function calcRequiredMargin(symbol: string, size: number): number {
  const spec = getSpec(symbol)
  return spec.initialMargin * size
}

export function calcMaintenanceMargin(symbol: string, size: number): number {
  const spec = getSpec(symbol)
  return spec.maintenanceMargin * size
}

export function calcRiskDollars(
  side: OrderSide,
  estimatedEntry: number,
  slPrice: number,
  symbol: ContractSymbol,
  size: number,
): number {
  const spec = getSpec(symbol)
  return Math.abs(estimatedEntry - slPrice) * spec.pointValue * size
}

export function calcRiskPercent(riskDollars: number, equity: number): number {
  if (equity <= 0) return 0
  return (riskDollars / equity) * 100
}

export function calcCommission(symbol: string, size: number): number {
  const spec = getSpec(symbol)
  return spec.commissionRoundTrip * size
}

export function checkMarginSufficiency(
  symbol: string,
  size: number,
  availableMargin: number,
): { canOpen: boolean; shortfall: number } {
  const required = calcRequiredMargin(symbol, size)
  const canOpen = availableMargin >= required
  return { canOpen, shortfall: canOpen ? 0 : required - availableMargin }
}

export function shouldLiquidate(equity: number, totalMaintenanceMargin: number): boolean {
  return equity < totalMaintenanceMargin
}
