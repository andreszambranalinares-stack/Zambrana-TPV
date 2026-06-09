import type { OHLCVCandle, Timeframe, Underlying } from '@/types'
import { UNDERLYING_BASE_PRICES, UNDERLYING_PARAMS } from '@/constants/contracts'

const TF_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
}

const DT = 1 / (252 * 6.5 * 3600) // one second in trading-year fraction

function randn(): number {
  // Box-Muller transform
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function gbmStep(price: number, mu: number, sigma: number): number {
  const drift = (mu - 0.5 * sigma * sigma) * DT
  const diffusion = sigma * Math.sqrt(DT) * randn()
  return price * Math.exp(drift + diffusion)
}

function roundToTick(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize
}

function poissonRandom(mean: number): number {
  const L = Math.exp(-mean)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

interface PartialCandle {
  open: number
  high: number
  low: number
  close: number
  volume: number
  ticksElapsed: number
  timeStart: number
}

export class GBMGenerator {
  private underlying: Underlying
  private lastPrice: number
  private mu: number
  private sigma: number
  private buffers: Map<Timeframe, PartialCandle> = new Map()
  private listeners: Map<string, ((candle: OHLCVCandle, isPartial: boolean) => void)[]> = new Map()
  private priceListeners: ((price: number) => void)[] = []
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor(underlying: Underlying) {
    this.underlying = underlying
    this.lastPrice = UNDERLYING_BASE_PRICES[underlying]
    const params = UNDERLYING_PARAMS[underlying]
    this.mu = params.mu
    this.sigma = params.sigma
    this.initBuffers()
  }

  private initBuffers(): void {
    const now = Math.floor(Date.now() / 1000)
    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h']
    for (const tf of timeframes) {
      const tfSecs = TF_SECONDS[tf]
      const alignedTime = Math.floor(now / tfSecs) * tfSecs
      this.buffers.set(tf, {
        open: this.lastPrice,
        high: this.lastPrice,
        low: this.lastPrice,
        close: this.lastPrice,
        volume: 0,
        ticksElapsed: 0,
        timeStart: alignedTime,
      })
    }
  }

  onCandle(tf: Timeframe, listener: (candle: OHLCVCandle, isPartial: boolean) => void): void {
    const key = tf
    if (!this.listeners.has(key)) this.listeners.set(key, [])
    this.listeners.get(key)!.push(listener)
  }

  offCandle(tf: Timeframe, listener: (candle: OHLCVCandle, isPartial: boolean) => void): void {
    const listeners = this.listeners.get(tf)
    if (listeners) {
      const idx = listeners.indexOf(listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }

  onPrice(listener: (price: number) => void): void {
    this.priceListeners.push(listener)
  }

  offPrice(listener: (price: number) => void): void {
    const idx = this.priceListeners.indexOf(listener)
    if (idx > -1) this.priceListeners.splice(idx, 1)
  }

  getInitialCandles(tf: Timeframe, count: number): OHLCVCandle[] {
    const tfSecs = TF_SECONDS[tf]
    const candles: OHLCVCandle[] = []
    let price = this.lastPrice
    const now = Math.floor(Date.now() / 1000)
    const startTime = Math.floor(now / tfSecs) * tfSecs - count * tfSecs

    for (let i = 0; i < count; i++) {
      const candleTime = startTime + i * tfSecs
      const open = price
      let high = open
      let low = open
      const stepsInCandle = Math.min(tfSecs, 60)
      for (let j = 0; j < stepsInCandle; j++) {
        price = roundToTick(gbmStep(price, this.mu, this.sigma * Math.sqrt(tfSecs / stepsInCandle)), 0.25)
        if (price > high) high = price
        if (price < low) low = price
      }
      const close = price
      candles.push({
        time: candleTime,
        open: roundToTick(open, 0.25),
        high: roundToTick(high, 0.25),
        low: roundToTick(low, 0.25),
        close: roundToTick(close, 0.25),
        volume: poissonRandom(200) * 50,
      })
    }
    this.lastPrice = price
    return candles
  }

  start(): void {
    if (this.intervalId) return
    this.initBuffers()
    this.intervalId = setInterval(() => this.tick(), 1000)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    const newPrice = roundToTick(gbmStep(this.lastPrice, this.mu, this.sigma), 0.25)
    this.lastPrice = newPrice

    for (const listener of this.priceListeners) {
      listener(newPrice)
    }

    const now = Math.floor(Date.now() / 1000)
    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h']

    for (const tf of timeframes) {
      const buf = this.buffers.get(tf)!
      const tfSecs = TF_SECONDS[tf]

      if (newPrice > buf.high) buf.high = newPrice
      if (newPrice < buf.low) buf.low = newPrice
      buf.close = newPrice
      buf.volume += poissonRandom(200)
      buf.ticksElapsed++

      const partialCandle: OHLCVCandle = {
        time: buf.timeStart,
        open: buf.open,
        high: buf.high,
        low: buf.low,
        close: buf.close,
        volume: buf.volume,
      }

      const listeners = this.listeners.get(tf) || []
      for (const l of listeners) l(partialCandle, true)

      if (buf.ticksElapsed >= tfSecs) {
        for (const l of listeners) l({ ...partialCandle }, false)
        const newTime = Math.floor(now / tfSecs) * tfSecs
        this.buffers.set(tf, {
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: 0,
          ticksElapsed: 0,
          timeStart: newTime,
        })
      }
    }
  }

  getCurrentPrice(): number {
    return this.lastPrice
  }
}
