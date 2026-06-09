import type { Timeframe } from '@/types'

interface TimeframeSelectorProps {
  value: Timeframe
  onChange: (tf: Timeframe) => void
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h']

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            value === tf
              ? 'bg-terminal-accent text-white'
              : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  )
}
