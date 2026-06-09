import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Position, ClosedTrade, OrderSide, ContractSymbol, CloseReason } from '@/types'
import {
  calcFloatingPnL,
  calcMaintenanceMargin,
  calcCommission,
} from '@/services/futuresEngine'

const DEFAULT_BALANCE = 10000

interface AccountState {
  initialBalance: number
  realizedPnL: number
  openPositions: Position[]
  closedTrades: ClosedTrade[]
  peakEquity: number
  maxDrawdown: number
  lastLiquidationAt: number | null

  // Computed helpers (derived on access via get())
  getEquity: () => number
  getMarginUsed: () => number
  getAvailableMargin: () => number
  getFloatingPnL: () => number

  // Actions
  openPosition: (
    orderId: string,
    symbol: ContractSymbol,
    side: OrderSide,
    size: number,
    fillPrice: number,
    slPrice: number,
    tpPrice: number | undefined,
  ) => void
  closePosition: (positionId: string, exitPrice: number, reason: CloseReason) => void
  updateFloatingPnL: (underlyingPrices: Record<string, number>) => void
  liquidateAll: (currentPrice: number, underlyingKey: string) => void
  resetAccount: (newBalance?: number) => void
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      initialBalance: DEFAULT_BALANCE,
      realizedPnL: 0,
      openPositions: [],
      closedTrades: [],
      peakEquity: DEFAULT_BALANCE,
      maxDrawdown: 0,
      lastLiquidationAt: null,

      getEquity: () => {
        const state = get()
        const floating = state.openPositions.reduce((sum, p) => sum + p.floatingPnL, 0)
        return state.initialBalance + state.realizedPnL + floating
      },

      getMarginUsed: () => {
        const state = get()
        return state.openPositions.reduce(
          (sum, p) => sum + calcMaintenanceMargin(p.symbol, p.size),
          0,
        )
      },

      getAvailableMargin: () => {
        const state = get()
        return state.getEquity() - state.getMarginUsed()
      },

      getFloatingPnL: () => {
        const state = get()
        return state.openPositions.reduce((sum, p) => sum + p.floatingPnL, 0)
      },

      openPosition: (orderId, symbol, side, size, fillPrice, slPrice, tpPrice) => {
        // Full round-trip commission paid upfront
        const commission = calcCommission(symbol, size)
        const newPosition: Position = {
          id: crypto.randomUUID(),
          orderId,
          symbol,
          side,
          size,
          entryPrice: fillPrice,
          slPrice,
          tpPrice,
          openedAt: Date.now(),
          commission,
          floatingPnL: 0,
        }
        set((state) => {
          const newRealizedPnL = state.realizedPnL - commission
          const equity = state.initialBalance + newRealizedPnL + state.openPositions.reduce((s, p) => s + p.floatingPnL, 0)
          const newPeakEquity = Math.max(state.peakEquity, equity)
          const drawdown = newPeakEquity > 0 ? ((newPeakEquity - equity) / newPeakEquity) * 100 : 0
          return {
            openPositions: [...state.openPositions, newPosition],
            realizedPnL: newRealizedPnL,
            peakEquity: newPeakEquity,
            maxDrawdown: Math.max(state.maxDrawdown, drawdown),
          }
        })
      },

      closePosition: (positionId, exitPrice, reason) => {
        set((state) => {
          const position = state.openPositions.find((p) => p.id === positionId)
          if (!position) return state

          // Recalculate gross P&L from scratch at exit price
          const grossPnL = calcFloatingPnL(position, exitPrice)
          // Commission already paid at open, so netPnL = grossPnL
          const netPnL = grossPnL

          const trade: ClosedTrade = {
            id: crypto.randomUUID(),
            positionId: position.id,
            symbol: position.symbol,
            side: position.side,
            size: position.size,
            entryPrice: position.entryPrice,
            exitPrice,
            slPrice: position.slPrice,
            tpPrice: position.tpPrice,
            openedAt: position.openedAt,
            closedAt: Date.now(),
            grossPnL,
            commission: position.commission,
            netPnL,
            closeReason: reason,
          }

          const newRealizedPnL = state.realizedPnL + grossPnL
          const newOpenPositions = state.openPositions.filter((p) => p.id !== positionId)
          const newEquity =
            state.initialBalance +
            newRealizedPnL +
            newOpenPositions.reduce((s, p) => s + p.floatingPnL, 0)
          const newPeakEquity = Math.max(state.peakEquity, newEquity)
          const drawdown =
            newPeakEquity > 0 ? ((newPeakEquity - newEquity) / newPeakEquity) * 100 : 0
          const newMaxDrawdown = Math.max(state.maxDrawdown, drawdown)

          return {
            openPositions: newOpenPositions,
            closedTrades: [...state.closedTrades, trade],
            realizedPnL: newRealizedPnL,
            peakEquity: newPeakEquity,
            maxDrawdown: newMaxDrawdown,
          }
        })
      },

      updateFloatingPnL: (underlyingPrices) => {
        set((state) => {
          const underlyingMap: Record<string, string> = {
            MNQ: 'NQ100',
            NQ: 'NQ100',
            MES: 'SP500',
            ES: 'SP500',
          }

          const updatedPositions = state.openPositions.map((p) => {
            const underlyingKey = underlyingMap[p.symbol]
            const price = underlyingKey ? underlyingPrices[underlyingKey] : undefined
            if (!price) return p
            return { ...p, floatingPnL: calcFloatingPnL(p, price) }
          })

          const equity =
            state.initialBalance +
            state.realizedPnL +
            updatedPositions.reduce((s, p) => s + p.floatingPnL, 0)
          const newPeakEquity = Math.max(state.peakEquity, equity)
          const drawdown =
            newPeakEquity > 0 ? ((newPeakEquity - equity) / newPeakEquity) * 100 : 0

          return {
            openPositions: updatedPositions,
            peakEquity: newPeakEquity,
            maxDrawdown: Math.max(state.maxDrawdown, drawdown),
          }
        })
      },

      liquidateAll: (currentPrice, underlyingKey) => {
        const { openPositions, closePosition, updateFloatingPnL } = get()
        updateFloatingPnL({ [underlyingKey]: currentPrice })
        // Snapshot positions before iterating since closePosition mutates state
        const positions = [...openPositions]
        for (const pos of positions) {
          closePosition(pos.id, currentPrice, 'LIQUIDATION')
        }
        set({ lastLiquidationAt: Date.now() })
      },

      resetAccount: (newBalance = DEFAULT_BALANCE) => {
        set({
          initialBalance: newBalance,
          realizedPnL: 0,
          openPositions: [],
          closedTrades: [],
          peakEquity: newBalance,
          maxDrawdown: 0,
          lastLiquidationAt: null,
        })
      },
    }),
    {
      name: 'fa_account',
      partialize: (state) => ({
        initialBalance: state.initialBalance,
        realizedPnL: state.realizedPnL,
        openPositions: state.openPositions,
        closedTrades: state.closedTrades,
        peakEquity: state.peakEquity,
        maxDrawdown: state.maxDrawdown,
        lastLiquidationAt: state.lastLiquidationAt,
      }),
    },
  ),
)
