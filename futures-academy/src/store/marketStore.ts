import { create } from 'zustand'
import type { OHLCVCandle, Timeframe, ContractSymbol, DataMode, Underlying } from '@/types'
import { GBMGenerator } from '@/services/gbmGenerator'

const generators = new Map<Underlying, GBMGenerator>()

function getGenerator(underlying: Underlying): GBMGenerator {
  if (!generators.has(underlying)) {
    generators.set(underlying, new GBMGenerator(underlying))
  }
  return generators.get(underlying)!
}

interface MarketState {
  mode: DataMode
  activeSymbol: ContractSymbol
  activeTimeframe: Timeframe
  currentPrices: Partial<Record<Underlying, number>>
  setMode: (mode: DataMode) => void
  setActiveSymbol: (symbol: ContractSymbol) => void
  setActiveTimeframe: (tf: Timeframe) => void
  setCurrentPrice: (underlying: Underlying, price: number) => void
  getGenerator: (underlying: Underlying) => GBMGenerator
}

// Suppress unused import warning — OHLCVCandle used transitively
type _OHLCVCandle = OHLCVCandle

export const useMarketStore = create<MarketState>((set) => ({
  mode: 'SIMULATED',
  activeSymbol: 'MNQ',
  activeTimeframe: '1m',
  currentPrices: {},
  setMode: (mode) => set({ mode }),
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTimeframe: (tf) => set({ activeTimeframe: tf }),
  setCurrentPrice: (underlying, price) =>
    set((state) => ({
      currentPrices: { ...state.currentPrices, [underlying]: price },
    })),
  getGenerator,
}))
