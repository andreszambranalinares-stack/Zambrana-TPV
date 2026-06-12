import { useRef } from 'react'
import { useChart } from '@/hooks/useChart'
import { useMarketFeed } from '@/hooks/useMarketFeed'
import { useMarketStore } from '@/store/marketStore'
import { PositionOverlay } from './PositionOverlay'

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null!)
  const { chartRef, seriesRef } = useChart(containerRef)
  const { activeSymbol, activeTimeframe } = useMarketStore()

  useMarketFeed(seriesRef, activeSymbol, activeTimeframe)

  return (
    <div className="relative w-full h-full min-h-0">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: '#0a0e1a' }}
      />
      <PositionOverlay seriesRef={seriesRef} chartRef={chartRef} containerRef={containerRef} />
    </div>
  )
}
