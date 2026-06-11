import { useEffect, useState } from 'react'
import type { ContractSymbol } from '@/types'
import { CONTRACT_SPECS } from '@/constants/contracts'
import { GBMGenerator } from '@/services/gbmGenerator'
import { useReplayStore, getReplayFloatingPnL } from '@/store/replayStore'
import { ReplayChart } from '@/components/replay/ReplayChart'
import { ReplayControls } from '@/components/replay/ReplayControls'

const REPLAY_SYMBOLS: ContractSymbol[] = ['MNQ', 'MES']
const SESSION_CANDLES = 400

export function ReplayPage() {
  const replay = useReplayStore()
  const [setupSymbol, setSetupSymbol] = useState<ContractSymbol>('MNQ')

  // Motor del replay: avanza una vela cada 1000/speed ms mientras no esté en pausa
  useEffect(() => {
    if (!replay.isActive || replay.isPaused) return
    const interval = setInterval(() => {
      useReplayStore.getState().advance()
    }, 1000 / replay.speed)
    return () => clearInterval(interval)
  }, [replay.isActive, replay.isPaused, replay.speed])

  function handleStart() {
    const spec = CONTRACT_SPECS[setupSymbol]
    // Generador independiente: no toca el feed en vivo del Terminal
    const generator = new GBMGenerator(spec.underlying)
    const candles = generator.getInitialCandles('1m', SESSION_CANDLES)
    replay.startSession(candles, spec.underlying, setupSymbol)
  }

  // ── Pantalla de configuración ──
  if (!replay.isActive) {
    return (
      <div className="p-4 lg:p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-terminal-text mb-2">Modo Replay</h2>
        <p className="text-terminal-muted text-sm mb-6">
          Reproduce una sesión de mercado simulada a la velocidad que elijas y practica entradas
          sin esperar al tiempo real. La práctica del replay no afecta a tu cuenta paper.
        </p>

        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 mb-4">
          <label className="text-terminal-muted text-xs mb-2 block">Contrato</label>
          <div className="flex gap-2">
            {REPLAY_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSetupSymbol(sym)}
                className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
                  setupSymbol === sym
                    ? 'bg-terminal-accent text-white'
                    : 'bg-terminal-bg text-terminal-muted border border-terminal-border hover:text-terminal-text'
                }`}
              >
                {sym}
                <span className="block text-xs opacity-70">{CONTRACT_SPECS[sym].name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-2.5 bg-terminal-accent hover:bg-blue-400 rounded font-semibold text-sm text-white transition-colors"
        >
          ▶ Generar sesión y empezar
        </button>
      </div>
    )
  }

  // ── Sesión activa ──
  const floatingPnL = getReplayFloatingPnL(replay)
  const currentCandle = replay.candles[replay.currentIndex - 1]
  const wins = replay.practiceTrades.filter((t) => t.pnl > 0).length

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[40vh]">
        <ReplayChart />
      </div>

      <div className="p-3 space-y-3 border-t border-terminal-border">
        <ReplayControls />

        {/* Panel de práctica */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-terminal-muted">{replay.symbol}: </span>
                <span className="text-terminal-green font-semibold tabular-nums">
                  {currentCandle ? currentCandle.close.toFixed(2) : '—'}
                </span>
              </div>
              <div>
                <span className="text-terminal-muted">P&L sesión: </span>
                <span
                  className={`font-semibold tabular-nums ${
                    replay.practicePnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                  }`}
                >
                  {replay.practicePnL >= 0 ? '+' : ''}${replay.practicePnL.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-terminal-muted">Trades: </span>
                <span className="text-terminal-text font-semibold">
                  {replay.practiceTrades.length}
                  {replay.practiceTrades.length > 0 && (
                    <span className="text-terminal-muted"> ({wins}G)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {replay.practicePosition ? (
                <>
                  <span
                    className={`text-xs font-semibold ${
                      replay.practicePosition.side === 'BUY'
                        ? 'text-terminal-green'
                        : 'text-terminal-red'
                    }`}
                  >
                    {replay.practicePosition.side === 'BUY' ? 'LARGO' : 'CORTO'} @{' '}
                    {replay.practicePosition.entryPrice.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      floatingPnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                    }`}
                  >
                    {floatingPnL >= 0 ? '+' : ''}${floatingPnL.toFixed(2)}
                  </span>
                  <button
                    onClick={replay.closePracticePosition}
                    className="px-3 py-1.5 bg-terminal-red hover:bg-red-400 rounded text-white text-xs font-semibold transition-colors"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => replay.openPracticePosition('BUY')}
                    className="px-3 py-1.5 bg-terminal-green hover:bg-green-400 rounded text-black text-xs font-semibold transition-colors"
                  >
                    Comprar 1
                  </button>
                  <button
                    onClick={() => replay.openPracticePosition('SELL')}
                    className="px-3 py-1.5 bg-terminal-red hover:bg-red-400 rounded text-white text-xs font-semibold transition-colors"
                  >
                    Vender 1
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
