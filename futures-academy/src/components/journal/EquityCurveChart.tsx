import { useEffect, useRef } from 'react'
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { JournalStats } from '@/store/journalStore'

interface EquityCurveChartProps {
  stats: JournalStats
  initialBalance: number
}

// Component is keyed on stats.totalTrades from the parent, so it remounts
// whenever a trade is added/removed. Data is loaded once on mount — no
// separate data-update effect needed, which avoids infinite-loop risks.
export function EquityCurveChart({ stats }: EquityCurveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0e1a' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      rightPriceScale: { borderColor: '#1e293b' },
      timeScale: { borderColor: '#1e293b', timeVisible: true },
      handleScroll: false,
      handleScale: false,
      width: containerRef.current.clientWidth,
      height: 240,
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.3)',
      bottomColor: 'rgba(59, 130, 246, 0.02)',
      lineWidth: 2,
    })

    chartRef.current = chart

    if (stats.equityCurve.length > 0) {
      try {
        areaSeries.setData(
          stats.equityCurve.map((p) => ({
            time: p.time as UTCTimestamp,
            value: p.value,
          })),
        )
        chart.timeScale().fitContent()
      } catch (err) {
        console.error('EquityCurveChart setData error:', err)
      }
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chartRef.current = null
      chart.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — parent keys on totalTrades to remount when data changes

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-terminal-border"
      style={{ height: 240, background: '#0a0e1a' }}
    >
      <div ref={containerRef} className="w-full h-full" />
      {stats.equityCurve.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-terminal-muted text-sm text-center px-4">
            Sin datos — cierra tu primera operación para ver la curva de equity
          </p>
        </div>
      )}
    </div>
  )
}
