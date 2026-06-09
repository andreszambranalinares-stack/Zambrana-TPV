import type { ContractSpec } from '@/types'

export const CONTRACT_SPECS: Record<string, ContractSpec> = {
  MNQ: {
    symbol: 'MNQ',
    name: 'Micro E-mini Nasdaq-100',
    underlying: 'NQ100',
    tickSize: 0.25,
    tickValue: 0.50,
    pointValue: 2,
    initialMargin: 1650,
    maintenanceMargin: 1500,
    commissionRoundTrip: 0.50,
  },
  NQ: {
    symbol: 'NQ',
    name: 'E-mini Nasdaq-100',
    underlying: 'NQ100',
    tickSize: 0.25,
    tickValue: 5.00,
    pointValue: 20,
    initialMargin: 16500,
    maintenanceMargin: 15000,
    commissionRoundTrip: 2.00,
  },
  MES: {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    underlying: 'SP500',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    initialMargin: 1400,
    maintenanceMargin: 1275,
    commissionRoundTrip: 0.50,
  },
  ES: {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    underlying: 'SP500',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    initialMargin: 14000,
    maintenanceMargin: 12750,
    commissionRoundTrip: 2.00,
  },
}

export const UNDERLYING_BASE_PRICES: Record<string, number> = {
  NQ100: 20000,
  SP500: 5800,
}

export const UNDERLYING_PARAMS: Record<string, { mu: number; sigma: number }> = {
  NQ100: { mu: 0.15, sigma: 0.20 },
  SP500: { mu: 0.12, sigma: 0.16 },
}
