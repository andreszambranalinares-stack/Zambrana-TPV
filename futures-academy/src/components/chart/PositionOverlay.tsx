import { useCallback, useEffect, useRef, useState } from 'react'
import type { IChartApi, ISeriesApi, IPriceLine } from 'lightweight-charts'
import { useAccountStore } from '@/store/accountStore'
import { calcFloatingPnL } from '@/services/futuresEngine'
import type { Position } from '@/types'

interface PositionOverlayProps {
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>
  chartRef: React.RefObject<IChartApi | null>
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface PriceLines {
  entry: IPriceLine
  sl: IPriceLine
  tp?: IPriceLine
}

interface Band {
  id: string
  entryY: number | null
  slY: number | null
  tpY: number | null
  pnlAtSL: number
  pnlAtTP: number
  side: 'BUY' | 'SELL'
}

function calcPnLAtPrice(position: Position, targetPrice: number): number {
  return calcFloatingPnL(position, targetPrice)
}

export function PositionOverlay({ seriesRef, chartRef, containerRef }: PositionOverlayProps) {
  const openPositions = useAccountStore((s) => s.openPositions)
  const linesRef = useRef<Map<string, PriceLines>>(new Map())
  const [bands, setBands] = useState<Band[]>([])
  const rafRef = useRef<number | null>(null)

  // Recalculate band pixel positions from current price scale
  const recalcBands = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const series = seriesRef.current
      if (!series || openPositions.length === 0) {
        setBands([])
        return
      }
      setBands(
        openPositions.map((pos) => ({
          id: pos.id,
          entryY: series.priceToCoordinate(pos.entryPrice),
          slY: series.priceToCoordinate(pos.slPrice),
          tpY: pos.tpPrice != null ? series.priceToCoordinate(pos.tpPrice) : null,
          pnlAtSL: calcPnLAtPrice(pos, pos.slPrice),
          pnlAtTP: pos.tpPrice != null ? calcPnLAtPrice(pos, pos.tpPrice) : 0,
          side: pos.side,
        })),
      )
      rafRef.current = null
    })
  }, [openPositions, seriesRef])

  // Subscribe to chart events so bands stay aligned when user zooms/scrolls
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.subscribeCrosshairMove(recalcBands)
    chart.timeScale().subscribeVisibleTimeRangeChange(recalcBands)
    return () => {
      chart.unsubscribeCrosshairMove(recalcBands)
      chart.timeScale().unsubscribeVisibleTimeRangeChange(recalcBands)
    }
  }, [chartRef, recalcBands])

  // Also recalc when positions change or chart first mounts
  useEffect(() => {
    recalcBands()
  }, [recalcBands])

  // ── Price lines (entry / SL / TP) ─────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    const currentIds = new Set(openPositions.map((p) => p.id))

    for (const [id, lines] of linesRef.current.entries()) {
      if (!currentIds.has(id)) {
        try {
          series.removePriceLine(lines.entry)
          series.removePriceLine(lines.sl)
          if (lines.tp) series.removePriceLine(lines.tp)
        } catch { /* ignore */ }
        linesRef.current.delete(id)
      }
    }

    for (const position of openPositions) {
      if (linesRef.current.has(position.id)) continue

      const isLong = position.side === 'BUY'
      const pnlSL = calcPnLAtPrice(position, position.slPrice)
      const pnlTP = position.tpPrice != null ? calcPnLAtPrice(position, position.tpPrice) : null

      const entryLine = series.createPriceLine({
        price: position.entryPrice,
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${position.symbol} ${isLong ? '▲ LARGO' : '▼ CORTO'}`,
      })

      const slLine = series.createPriceLine({
        price: position.slPrice,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `SL  ${pnlSL.toFixed(0)}$`,
      })

      const lines: PriceLines = { entry: entryLine, sl: slLine }

      if (position.tpPrice != null && pnlTP != null) {
        lines.tp = series.createPriceLine({
          price: position.tpPrice,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `TP  +${pnlTP.toFixed(0)}$`,
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

  // ── Band overlay (HTML, pointer-events-none) ───────────────────────────────
  return (
    <>
      {bands.map((band) => {
        if (band.entryY == null || band.slY == null) return null
        const containerH = containerRef.current?.clientHeight ?? 0

        // Profit zone (entry → TP)
        const showTP = band.tpY != null
        const tpTop = showTP ? Math.min(band.entryY, band.tpY!) : null
        const tpH = showTP ? Math.abs(band.entryY - band.tpY!) : null

        // Loss zone (entry → SL)
        const slTop = Math.min(band.entryY, band.slY)
        const slH = Math.abs(band.entryY - band.slY)

        return (
          <div key={band.id} className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* TP / profit band */}
            {showTP && tpTop != null && tpH != null && tpH > 2 && (
              <div
                className="absolute left-0 right-8"
                style={{
                  top: Math.max(0, tpTop),
                  height: Math.min(tpH, containerH),
                  background: 'rgba(34,197,94,0.10)',
                  borderTop: band.side === 'BUY' ? '1px dashed rgba(34,197,94,0.4)' : undefined,
                  borderBottom: band.side === 'SELL' ? '1px dashed rgba(34,197,94,0.4)' : undefined,
                }}
              >
                {/* Label en el centro de la banda */}
                {tpH > 24 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-green-400 tabular-nums whitespace-nowrap">
                    +${band.pnlAtTP.toFixed(0)}
                  </div>
                )}
              </div>
            )}

            {/* SL / loss band */}
            {slH > 2 && (
              <div
                className="absolute left-0 right-8"
                style={{
                  top: Math.max(0, slTop),
                  height: Math.min(slH, containerH),
                  background: 'rgba(239,68,68,0.10)',
                  borderTop: band.side === 'SELL' ? '1px dashed rgba(239,68,68,0.4)' : undefined,
                  borderBottom: band.side === 'BUY' ? '1px dashed rgba(239,68,68,0.4)' : undefined,
                }}
              >
                {slH > 24 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-red-400 tabular-nums whitespace-nowrap">
                    ${band.pnlAtSL.toFixed(0)}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
