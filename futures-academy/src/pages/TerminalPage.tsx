import { ChartToolbar } from '@/components/chart/ChartToolbar'
import { TradingChart } from '@/components/chart/TradingChart'

export function TerminalPage() {
  return (
    <div className="flex flex-col h-full">
      <ChartToolbar />
      <div className="flex-1 min-h-0">
        <TradingChart />
      </div>
    </div>
  )
}
