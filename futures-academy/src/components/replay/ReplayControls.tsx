import { useReplayStore } from '@/store/replayStore'

const SPEEDS = [1, 2, 5, 10]

export function ReplayControls() {
  const { isPaused, speed, currentIndex, candles, togglePause, setSpeed, seekTo, stopSession } =
    useReplayStore()

  const progress = candles.length > 0 ? (currentIndex / candles.length) * 100 : 0
  const finished = currentIndex >= candles.length

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3 space-y-3">
      {/* Barra de progreso (seek) */}
      <div className="flex items-center gap-3">
        <span className="text-terminal-muted text-xs tabular-nums w-20">
          {currentIndex}/{candles.length}
        </span>
        <input
          type="range"
          min={1}
          max={candles.length}
          value={currentIndex}
          onChange={(e) => seekTo(parseInt(e.target.value))}
          className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
        />
        <span className="text-terminal-muted text-xs tabular-nums w-10 text-right">
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Play / Pause */}
        <button
          onClick={togglePause}
          disabled={finished}
          className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
            finished
              ? 'bg-terminal-border text-terminal-muted cursor-not-allowed'
              : isPaused
              ? 'bg-terminal-green hover:bg-green-400 text-black'
              : 'bg-terminal-yellow hover:bg-yellow-400 text-black'
          }`}
        >
          {finished ? 'Fin' : isPaused ? '▶ Reproducir' : '⏸ Pausa'}
        </button>

        {/* Velocidad */}
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-terminal-accent text-white'
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={() => seekTo(20)}
          className="px-3 py-1.5 text-xs border border-terminal-border rounded text-terminal-muted hover:text-terminal-text transition-colors"
        >
          ⟲ Reiniciar
        </button>

        <button
          onClick={stopSession}
          className="ml-auto px-3 py-1.5 text-xs border border-terminal-border rounded text-terminal-muted hover:border-terminal-red hover:text-terminal-red transition-colors"
        >
          Salir del replay
        </button>
      </div>
    </div>
  )
}
