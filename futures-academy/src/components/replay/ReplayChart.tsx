import { useEffect, useRef } from 'react'
import type { UTCTimestamp } from 'lightweight-charts'
import { useChart } from '@/hooks/useChart'
import { useReplayStore } from '@/store/replayStore'

// Gráfico dedicado al modo replay: muestra las velas hasta currentIndex.
// Independiente del gráfico del Terminal y del feed en vivo.
export function ReplayChart() {
  const containerRef = useRef<HTMLDivElement>(null!)
  const { seriesRef } = useChart(containerRef)
  const candles = useReplayStore((s) => s.candles)
  const currentIndex = useReplayStore((s) => s.currentIndex)
  const lastRenderedIndexRef = useRef(0)

  useEffect(() => {
    const series = seriesRef.current
    if (!series || candles.length === 0) return

    const toChartCandle = (c: (typeof candles)[number]) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })

    if (currentIndex < lastRenderedIndexRef.current || lastRenderedIndexRef.current === 0) {
      // Seek hacia atrás o primera carga: repintar todo el rango visible
      series.setData(candles.slice(0, currentIndex).map(toChartCandle))
    } else {
      // Avance normal: añadir solo las velas nuevas
      for (let i = lastRenderedIndexRef.current; i < currentIndex; i++) {
        series.update(toChartCandle(candles[i]))
      }
    }
    lastRenderedIndexRef.current = currentIndex
  }, [candles, currentIndex, seriesRef])

  return (
    <div className="relative w-full h-full min-h-0">
      <div ref={containerRef} className="w-full h-full" style={{ background: '#0a0e1a' }} />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-purple-300 text-xs font-semibold pointer-events-none">
        ▶ REPLAY
      </div>
    </div>
  )
}
