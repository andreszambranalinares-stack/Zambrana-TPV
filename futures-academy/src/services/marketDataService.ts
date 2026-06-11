import type { OHLCVCandle, Timeframe, Underlying } from '@/types'

interface RealCandleResponse {
  candles: OHLCVCandle[]
}

export async function fetchRealCandles(
  underlying: Underlying,
  interval: Timeframe,
): Promise<OHLCVCandle[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `/.netlify/functions/market-proxy?underlying=${underlying}&interval=${interval}`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    if (res.status === 204 || res.status === 503) return []
    if (!res.ok) {
      console.warn(`[FuturesAcademy] market-proxy ${res.status}, falling back to simulation`)
      return []
    }

    const data = await res.json() as RealCandleResponse
    return data.candles ?? []
  } catch {
    console.warn('[FuturesAcademy] real data unavailable, using simulation')
    return []
  }
}
