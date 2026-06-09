import { useRef } from 'react'
import { useChart } from '@/hooks/useChart'
import { useMarketFeed } from '@/hooks/useMarketFeed'
import { useMarketStore } from '@/store/marketStore'

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { seriesRef } = useChart(containerRef)
  const { activeSymbol, activeTimeframe } = useMarketStore()

  useMarketFeed(seriesRef, activeSymbol, activeTimeframe)

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-0"
      style={{ background: '#0a0e1a' }}
    />
  )
}
