import { create } from 'zustand'
import type { OHLCVCandle, Underlying, ContractSymbol, OrderSide } from '@/types'
import { CONTRACT_SPECS } from '@/constants/contracts'

// Posición de práctica del modo replay — aislada por completo de la cuenta paper real.
// Nada de este store se persiste: cada sesión de replay empieza de cero.

export interface ReplayPosition {
  side: OrderSide
  symbol: ContractSymbol
  size: number
  entryPrice: number
  entryIndex: number
}

export interface ReplayTrade {
  side: OrderSide
  symbol: ContractSymbol
  size: number
  entryPrice: number
  exitPrice: number
  pnl: number
}

interface ReplayState {
  isActive: boolean
  isPaused: boolean
  speed: number // velas por segundo: 1, 2, 5, 10
  candles: OHLCVCandle[]
  currentIndex: number
  underlying: Underlying
  symbol: ContractSymbol

  // Cuenta de práctica (solo en memoria)
  practicePnL: number
  practicePosition: ReplayPosition | null
  practiceTrades: ReplayTrade[]

  startSession: (candles: OHLCVCandle[], underlying: Underlying, symbol: ContractSymbol) => void
  stopSession: () => void
  togglePause: () => void
  setSpeed: (speed: number) => void
  advance: () => void
  seekTo: (index: number) => void
  openPracticePosition: (side: OrderSide) => void
  closePracticePosition: () => void
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  isActive: false,
  isPaused: true,
  speed: 2,
  candles: [],
  currentIndex: 0,
  underlying: 'NQ100',
  symbol: 'MNQ',

  practicePnL: 0,
  practicePosition: null,
  practiceTrades: [],

  startSession: (candles, underlying, symbol) =>
    set({
      isActive: true,
      isPaused: true,
      candles,
      currentIndex: Math.min(20, candles.length), // arranca mostrando las primeras velas
      underlying,
      symbol,
      practicePnL: 0,
      practicePosition: null,
      practiceTrades: [],
    }),

  stopSession: () =>
    set({
      isActive: false,
      isPaused: true,
      candles: [],
      currentIndex: 0,
      practicePosition: null,
    }),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  setSpeed: (speed) => set({ speed }),

  advance: () => {
    const { currentIndex, candles } = get()
    if (currentIndex >= candles.length) {
      set({ isPaused: true })
      return
    }
    set({ currentIndex: currentIndex + 1 })
  },

  seekTo: (index) =>
    set((s) => ({
      currentIndex: Math.max(1, Math.min(index, s.candles.length)),
      // Saltar en el tiempo invalida la posición abierta de práctica
      practicePosition: null,
    })),

  openPracticePosition: (side) => {
    const { candles, currentIndex, symbol, practicePosition } = get()
    if (practicePosition || currentIndex === 0) return
    const candle = candles[currentIndex - 1]
    if (!candle) return
    set({
      practicePosition: {
        side,
        symbol,
        size: 1,
        entryPrice: candle.close,
        entryIndex: currentIndex,
      },
    })
  },

  closePracticePosition: () => {
    const { practicePosition, candles, currentIndex, practicePnL, practiceTrades } = get()
    if (!practicePosition) return
    const candle = candles[currentIndex - 1]
    if (!candle) return

    const spec = CONTRACT_SPECS[practicePosition.symbol]
    const direction = practicePosition.side === 'BUY' ? 1 : -1
    const pnl =
      (candle.close - practicePosition.entryPrice) * direction * spec.pointValue * practicePosition.size

    const trade: ReplayTrade = {
      side: practicePosition.side,
      symbol: practicePosition.symbol,
      size: practicePosition.size,
      entryPrice: practicePosition.entryPrice,
      exitPrice: candle.close,
      pnl,
    }

    set({
      practicePosition: null,
      practicePnL: practicePnL + pnl,
      practiceTrades: [...practiceTrades, trade],
    })
  },
}))

// P&L flotante de la posición de práctica al precio de la vela actual
export function getReplayFloatingPnL(state: {
  practicePosition: ReplayPosition | null
  candles: OHLCVCandle[]
  currentIndex: number
}): number {
  const { practicePosition, candles, currentIndex } = state
  if (!practicePosition || currentIndex === 0) return 0
  const candle = candles[currentIndex - 1]
  if (!candle) return 0
  const spec = CONTRACT_SPECS[practicePosition.symbol]
  const direction = practicePosition.side === 'BUY' ? 1 : -1
  return (
    (candle.close - practicePosition.entryPrice) * direction * spec.pointValue * practicePosition.size
  )
}
