import { useEffect, useRef } from 'react'
import type { ISeriesApi, IPriceLine } from 'lightweight-charts'
import { useAccountStore } from '@/store/accountStore'

interface PositionOverlayProps {
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>
}

interface PriceLines {
  entry: IPriceLine
  sl: IPriceLine
  tp?: IPriceLine
}

export function PositionOverlay({ seriesRef }: PositionOverlayProps) {
  const openPositions = useAccountStore((s) => s.openPositions)
  const linesRef = useRef<Map<string, PriceLines>>(new Map())

  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    const currentIds = new Set(openPositions.map((p) => p.id))

    // Remove lines for closed positions
    for (const [id, lines] of linesRef.current.entries()) {
      if (!currentIds.has(id)) {
        try {
          series.removePriceLine(lines.entry)
          series.removePriceLine(lines.sl)
          if (lines.tp) series.removePriceLine(lines.tp)
        } catch {
          // ignore if already removed
        }
        linesRef.current.delete(id)
      }
    }

    // Add lines for new positions
    for (const position of openPositions) {
      if (linesRef.current.has(position.id)) continue

      const isLong = position.side === 'BUY'

      const entryLine = series.createPriceLine({
        price: position.entryPrice,
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: `${position.symbol} ${isLong ? '▲' : '▼'} entrada`,
      })

      const slLine = series.createPriceLine({
        price: position.slPrice,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      })

      const lines: PriceLines = { entry: entryLine, sl: slLine }

      if (position.tpPrice) {
        lines.tp = series.createPriceLine({
          price: position.tpPrice,
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'TP',
        })
      }

      linesRef.current.set(position.id, lines)
    }
  }, [openPositions, seriesRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const series = seriesRef.current
      if (!series) return
      for (const lines of linesRef.current.values()) {
        try {
          series.removePriceLine(lines.entry)
          series.removePriceLine(lines.sl)
          if (lines.tp) series.removePriceLine(lines.tp)
        } catch { /* ignore */ }
      }
      linesRef.current.clear()
    }
  }, [seriesRef])

  return null
}
