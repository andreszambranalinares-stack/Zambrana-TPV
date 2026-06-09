import { useState, useEffect } from 'react'

export function DisclaimerBanner() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const ack = localStorage.getItem('fa_disclaimer_ack')
    if (ack) {
      setAcknowledged(true)
      setCollapsed(true)
    }
  }, [])

  const handleAck = () => {
    localStorage.setItem('fa_disclaimer_ack', '1')
    setAcknowledged(true)
    setCollapsed(true)
  }

  if (collapsed && acknowledged) {
    return (
      <div
        className="bg-yellow-900/20 border-b border-yellow-700/30 px-4 py-1 text-xs text-yellow-500/70 text-center cursor-pointer hover:bg-yellow-900/30 transition-colors"
        onClick={() => setCollapsed(false)}
      >
        ⚠ SIMULADOR EDUCATIVO — Sin dinero real — No es asesoramiento financiero
      </div>
    )
  }

  return (
    <div className="bg-yellow-900/30 border-b border-yellow-600/40 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 text-xl mt-0.5">⚠</span>
          <div className="flex-1">
            <p className="text-yellow-300 font-semibold text-sm mb-1">
              SIMULADOR EDUCATIVO — Sin dinero real
            </p>
            <p className="text-yellow-200/80 text-xs leading-relaxed">
              Esta aplicación es exclusivamente educativa. <strong>No usa dinero real ni ejecuta órdenes reales.</strong>{' '}
              El trading de futuros apalancados conlleva <strong>alto riesgo de pérdida</strong>; la mayoría de traders
              minoristas pierde dinero. No se garantiza ninguna rentabilidad. Esto no es asesoramiento financiero ni
              de inversión. Toda operación se realiza con saldo ficticio.
            </p>
          </div>
          {!acknowledged && (
            <button
              onClick={handleAck}
              className="ml-auto px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-semibold rounded transition-colors whitespace-nowrap"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
