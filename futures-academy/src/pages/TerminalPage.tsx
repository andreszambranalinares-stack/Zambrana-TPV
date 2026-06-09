import { useEffect, useRef, useState } from 'react'
import { useOrderExecution } from '@/hooks/useOrderExecution'
import { useAccountStore } from '@/store/accountStore'
import { ChartToolbar } from '@/components/chart/ChartToolbar'
import { TradingChart } from '@/components/chart/TradingChart'
import { OrderPanel } from '@/components/orderPanel/OrderPanel'
import { PositionsTable } from '@/components/positions/PositionsTable'
import { AccountPanel } from '@/components/account/AccountPanel'
import { Toast } from '@/components/ui/Toast'

export function TerminalPage() {
  useOrderExecution()

  const lastLiquidationAt = useAccountStore((s) => s.lastLiquidationAt)
  const [showLiqToast, setShowLiqToast] = useState(false)
  const prevLiqRef = useRef<number | null>(null)

  useEffect(() => {
    if (lastLiquidationAt && lastLiquidationAt !== prevLiqRef.current) {
      prevLiqRef.current = lastLiquidationAt
      setShowLiqToast(true)
    }
  }, [lastLiquidationAt])

  return (
    <div className="flex flex-col h-full">
      <ChartToolbar />
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Chart area */}
        <div className="flex-1 min-h-0 min-w-0">
          <TradingChart />
        </div>

        {/* Right panel */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-terminal-border flex flex-col overflow-y-auto">
          <div className="p-3 space-y-3">
            <AccountPanel />
            <OrderPanel />
          </div>
          <div className="border-t border-terminal-border">
            <div className="px-3 py-2 text-xs text-terminal-muted font-semibold">
              Posiciones abiertas
            </div>
            <PositionsTable />
          </div>
        </div>
      </div>

      {showLiqToast && (
        <Toast
          message="⚠ Cuenta liquidada. Margen de mantenimiento insuficiente. Todas las posiciones han sido cerradas."
          type="error"
          onDismiss={() => setShowLiqToast(false)}
          duration={8000}
        />
      )}
    </div>
  )
}
