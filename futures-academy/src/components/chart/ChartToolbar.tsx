import { useMarketStore } from '@/store/marketStore'
import { TimeframeSelector } from './TimeframeSelector'
import type { ContractSymbol, Timeframe } from '@/types'
import { CONTRACT_SPECS } from '@/constants/contracts'

const SYMBOLS: ContractSymbol[] = ['MNQ', 'MES', 'NQ', 'ES']

export function ChartToolbar() {
  const {
    activeSymbol,
    setActiveSymbol,
    activeTimeframe,
    setActiveTimeframe,
    mode,
    setMode,
    currentPrices,
    realDataAvailable,
    realDataError,
  } = useMarketStore()

  const spec = CONTRACT_SPECS[activeSymbol]
  const price = spec ? currentPrices[spec.underlying] : undefined
  const showFallbackWarning = mode === 'REAL' && !realDataAvailable

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-terminal-border bg-terminal-surface">
        <div className="flex items-center gap-1">
          {SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => setActiveSymbol(sym)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                activeSymbol === sym
                  ? 'bg-terminal-accent text-white'
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-terminal-border" />

        <TimeframeSelector
          value={activeTimeframe}
          onChange={(tf: Timeframe) => setActiveTimeframe(tf)}
        />

        <div className="ml-auto flex items-center gap-3">
          {price && (
            <span className="text-terminal-green font-semibold text-sm tabular-nums">
              {price.toFixed(2)}
            </span>
          )}
          <button
            onClick={() => setMode(mode === 'SIMULATED' ? 'REAL' : 'SIMULATED')}
            title={
              mode === 'SIMULATED'
                ? 'Cambiar a datos reales (requiere MARKET_API_KEY en Netlify)'
                : 'Cambiar a simulación'
            }
            className={`text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${
              mode === 'SIMULATED'
                ? 'text-terminal-yellow border-terminal-yellow/30 bg-terminal-yellow/10 hover:bg-terminal-yellow/20'
                : 'text-terminal-green border-terminal-green/30 bg-terminal-green/10 hover:bg-terminal-green/20'
            }`}
          >
            {mode === 'SIMULATED' ? 'SIM' : 'REAL'}
          </button>
        </div>
      </div>

      {showFallbackWarning && (
        <div className="px-4 py-1.5 bg-yellow-900/20 border-b border-yellow-700/30 text-xs text-yellow-400 flex items-center gap-2">
          <span>⚠</span>
          <span>
            {realDataError ?? 'Datos reales no disponibles'} — usando simulación.
            Configura <code className="font-mono bg-yellow-900/30 px-1 rounded">MARKET_API_KEY</code> en las variables de entorno de Netlify.
          </span>
        </div>
      )}
    </>
  )
}
