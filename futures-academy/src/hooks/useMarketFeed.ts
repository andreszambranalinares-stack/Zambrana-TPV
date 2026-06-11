import { useEffect, useRef } from 'react'
import type { ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import type { OHLCVCandle, Timeframe } from '@/types'
import { useMarketStore } from '@/store/marketStore'
import { CONTRACT_SPECS } from '@/constants/contracts'
import { fetchRealCandles } from '@/services/marketDataService'

export function useMarketFeed(
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>,
  symbol: string,
  timeframe: Timeframe,
) {
  const { getGenerator, setCurrentPrice, mode, setRealDataAvailable } = useMarketStore()
  const initializedRef = useRef(false)

  // Reset initialization when symbol or timeframe changes
  useEffect(() => {
    initializedRef.current = false
  }, [symbol, timeframe, mode])

  useEffect(() => {
    const spec = CONTRACT_SPECS[symbol]
    if (!spec) return

    const generator = getGenerator(spec.underlying)

    function loadSimulated() {
      if (initializedRef.current) return
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

    if (mode === 'REAL') {
      fetchRealCandles(spec.underlying, timeframe).then((realCandles) => {
        if (realCandles.length > 0 && seriesRef.current) {
          seriesRef.current.setData(
            realCandles.map((c) => ({
              time: c.time as UTCTimestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            })),
          )
          setRealDataAvailable(true)
          initializedRef.current = true
        } else {
          // Fallback to simulation
          setRealDataAvailable(false, 'Datos reales no disponibles')
          loadSimulated()
        }
      })
    } else {
      setRealDataAvailable(false)
      loadSimulated()
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
  }, [symbol, timeframe, mode, seriesRef, getGenerator, setCurrentPrice, setRealDataAvailable])
}
