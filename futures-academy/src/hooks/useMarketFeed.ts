import { useEffect, useRef } from 'react'
import type { ISeriesApi } from 'lightweight-charts'
import type { OHLCVCandle, Timeframe } from '@/types'
import type { UTCTimestamp } from 'lightweight-charts'
import { useMarketStore } from '@/store/marketStore'
import { CONTRACT_SPECS } from '@/constants/contracts'

export function useMarketFeed(
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>,
  symbol: string,
  timeframe: Timeframe,
) {
  const { getGenerator, setCurrentPrice } = useMarketStore()
  const initializedRef = useRef(false)

  useEffect(() => {
    const spec = CONTRACT_SPECS[symbol]
    if (!spec) return

    const generator = getGenerator(spec.underlying)

    if (!initializedRef.current) {
      const historical = generator.getInitialCandles(timeframe, 200)
      if (seriesRef.current) {
        seriesRef.current.setData(
          historical.map((c) => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        )
      }
      initializedRef.current = true
    }

    const candleListener = (candle: OHLCVCandle) => {
      if (!seriesRef.current) return
      seriesRef.current.update({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })
    }

    const priceListener = (price: number) => {
      setCurrentPrice(spec.underlying, price)
    }

    generator.onCandle(timeframe, candleListener)
    generator.onPrice(priceListener)
    generator.start()

    return () => {
      generator.offCandle(timeframe, candleListener)
      generator.offPrice(priceListener)
    }
  }, [symbol, timeframe, seriesRef, getGenerator, setCurrentPrice])
}
