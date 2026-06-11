// Netlify serverless function — proxies market data requests to Twelve Data API.
// The MARKET_API_KEY env var is never exposed to the client.

interface HandlerEvent {
  queryStringParameters: Record<string, string> | null
}

interface HandlerResponse {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

type Handler = (event: HandlerEvent) => Promise<HandlerResponse>

const TWELVEDATA_BASE = 'https://api.twelvedata.com'

const SYMBOL_MAP: Record<string, string> = {
  NQ100: 'NDX',
  SP500: 'SPX',
}

const INTERVAL_MAP: Record<string, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '4h': '4h',
}

export const handler: Handler = async (event) => {
  const apiKey = process.env['MARKET_API_KEY']

  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'MARKET_API_KEY not configured' }),
    }
  }

  const params = event.queryStringParameters ?? {}
  const { underlying, interval } = params

  if (!underlying || !interval) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required params: underlying, interval' }),
    }
  }

  const tdSymbol = SYMBOL_MAP[underlying]
  const tdInterval = INTERVAL_MAP[interval]

  if (!tdSymbol || !tdInterval) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unknown underlying "${underlying}" or interval "${interval}"` }),
    }
  }

  try {
    const url = new URL(`${TWELVEDATA_BASE}/time_series`)
    url.searchParams.set('symbol', tdSymbol)
    url.searchParams.set('interval', tdInterval)
    url.searchParams.set('outputsize', '200')
    url.searchParams.set('format', 'JSON')
    url.searchParams.set('apikey', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Twelve Data API error: ${response.statusText}` }),
      }
    }

    const data = await response.json() as {
      status?: string
      code?: number
      message?: string
      values?: Array<{
        datetime: string
        open: string
        high: string
        low: string
        close: string
        volume: string
      }>
    }

    if (data.status === 'error' || data.code) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: data.message ?? 'API limit reached' }),
      }
    }

    if (!data.values || data.values.length === 0) {
      return { statusCode: 204, body: '' }
    }

    // Reverse: Twelve Data returns newest-first; we want chronological
    const candles = data.values
      .slice()
      .reverse()
      .map((v) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume),
      }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ candles }),
    }
  } catch (error) {
    console.error('[market-proxy] Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal proxy error' }),
    }
  }
}
