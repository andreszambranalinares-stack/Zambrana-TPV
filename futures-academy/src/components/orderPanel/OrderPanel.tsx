import { useState } from 'react'
import { useMarketStore } from '@/store/marketStore'
import { useAccountStore } from '@/store/accountStore'
import { useRiskGuard } from '@/hooks/useRiskGuard'
import { Modal } from '@/components/ui/Modal'
import { CONTRACT_SPECS } from '@/constants/contracts'
import { checkMarginSufficiency, calcRequiredMargin } from '@/services/futuresEngine'
import type { ContractSymbol, OrderSide } from '@/types'

const MICRO_SYMBOLS: ContractSymbol[] = ['MNQ', 'MES']

export function OrderPanel() {
  const { activeSymbol, setActiveSymbol, currentPrices } = useMarketStore()
  const account = useAccountStore()
  const { checkRisk } = useRiskGuard()

  const [side, setSide] = useState<OrderSide>('BUY')
  const [size, setSize] = useState(1)
  const [slPrice, setSlPrice] = useState('')
  const [tpPrice, setTpPrice] = useState('')
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [error, setError] = useState('')

  const spec = CONTRACT_SPECS[activeSymbol]
  const underlying = spec?.underlying
  const currentPrice = underlying ? currentPrices[underlying] : undefined
  const availableMargin = account.getAvailableMargin()

  const slNum = parseFloat(slPrice)
  const tpNum = tpPrice ? parseFloat(tpPrice) : undefined
  const hasValidSL = !isNaN(slNum) && slNum > 0

  // Validate SL direction
  const slValid =
    hasValidSL &&
    ((side === 'BUY' && slNum < (currentPrice ?? Infinity)) ||
      (side === 'SELL' && slNum > (currentPrice ?? 0)))

  const riskInfo =
    hasValidSL && currentPrice
      ? checkRisk(side, currentPrice, slNum, activeSymbol, size)
      : null

  const marginCheck = checkMarginSufficiency(activeSymbol, size, availableMargin)

  const canSubmit =
    slValid && !isNaN(size) && size >= 1 && !!currentPrice && marginCheck.canOpen

  function handleSubmit() {
    if (!canSubmit || !currentPrice) return
    setError('')

    if (riskInfo?.isHighRisk) {
      setShowRiskModal(true)
      setPendingSubmit(true)
      return
    }

    executeOrder(currentPrice)
  }

  function executeOrder(fillPrice: number) {
    const orderId = crypto.randomUUID()
    account.openPosition(orderId, activeSymbol, side, size, fillPrice, slNum, tpNum)
    // Reset form
    setSlPrice('')
    setTpPrice('')
    setSize(1)
    setPendingSubmit(false)
  }

  function handleRiskConfirm() {
    setShowRiskModal(false)
    if (currentPrice) executeOrder(currentPrice)
  }

  // Suppress unused variable warning
  void pendingSubmit

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
      <h3 className="text-terminal-text text-sm font-semibold mb-3">Nueva Orden</h3>

      {/* Contract selector — micro only */}
      <div className="flex gap-1 mb-3">
        {MICRO_SYMBOLS.map((sym) => (
          <button
            key={sym}
            onClick={() => setActiveSymbol(sym)}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              activeSymbol === sym
                ? 'bg-terminal-accent text-white'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text border border-terminal-border'
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Buy/Sell */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
            side === 'BUY'
              ? 'bg-terminal-green text-black'
              : 'bg-terminal-bg text-terminal-muted border border-terminal-border hover:border-terminal-green/50'
          }`}
        >
          COMPRAR
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
            side === 'SELL'
              ? 'bg-terminal-red text-white'
              : 'bg-terminal-bg text-terminal-muted border border-terminal-border hover:border-terminal-red/50'
          }`}
        >
          VENDER
        </button>
      </div>

      {/* Contracts */}
      <div className="mb-3">
        <label className="text-terminal-muted text-xs mb-1 block">Contratos</label>
        <input
          type="number"
          min="1"
          max="10"
          value={size}
          onChange={(e) => setSize(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-accent"
        />
        {spec && (
          <p className="text-terminal-muted text-xs mt-1">
            Valor del punto: ${spec.pointValue}/contrato · Tick: ${spec.tickValue}
          </p>
        )}
      </div>

      {/* Precio actual */}
      {currentPrice && (
        <div className="mb-3 p-2 bg-terminal-bg rounded border border-terminal-border">
          <span className="text-terminal-muted text-xs">Precio actual: </span>
          <span className="text-terminal-green font-semibold text-sm">{currentPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Stop Loss — obligatorio */}
      <div className="mb-3">
        <label className="text-terminal-muted text-xs mb-1 flex items-center gap-1 block">
          Stop Loss <span className="text-terminal-red">*</span>
          <span className="text-terminal-muted text-xs">(obligatorio)</span>
        </label>
        <input
          type="number"
          step="0.25"
          value={slPrice}
          onChange={(e) => setSlPrice(e.target.value)}
          placeholder={
            side === 'BUY' ? 'Por debajo del precio actual' : 'Por encima del precio actual'
          }
          className={`w-full bg-terminal-bg border rounded px-3 py-2 text-terminal-text text-sm focus:outline-none ${
            slPrice && !slValid
              ? 'border-terminal-red focus:border-terminal-red'
              : 'border-terminal-border focus:border-terminal-accent'
          }`}
        />
        {slPrice && !slValid && (
          <p className="text-terminal-red text-xs mt-1">
            {side === 'BUY'
              ? 'El SL debe ser inferior al precio actual'
              : 'El SL debe ser superior al precio actual'}
          </p>
        )}
      </div>

      {/* Take Profit — opcional */}
      <div className="mb-3">
        <label className="text-terminal-muted text-xs mb-1 block">Take Profit (opcional)</label>
        <input
          type="number"
          step="0.25"
          value={tpPrice}
          onChange={(e) => setTpPrice(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-accent"
        />
      </div>

      {/* Risk summary */}
      {riskInfo && currentPrice && (
        <div
          className={`mb-3 p-2 rounded border text-xs ${
            riskInfo.isHighRisk
              ? 'border-terminal-red/50 bg-terminal-red/10 text-terminal-red'
              : 'border-terminal-border bg-terminal-bg text-terminal-muted'
          }`}
        >
          <div className="flex justify-between">
            <span>Riesgo en $:</span>
            <span className="font-semibold">${riskInfo.riskDollars.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>% del equity:</span>
            <span
              className={`font-semibold ${riskInfo.isHighRisk ? 'text-terminal-red' : 'text-terminal-yellow'}`}
            >
              {riskInfo.riskPercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Margen requerido:</span>
            <span>${calcRequiredMargin(activeSymbol, size).toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Margin error */}
      {!marginCheck.canOpen && (
        <div className="mb-3 p-2 rounded border border-terminal-red/50 bg-terminal-red/10 text-terminal-red text-xs">
          Margen insuficiente. Necesitas ${marginCheck.shortfall.toFixed(0)} más.
        </div>
      )}

      {error && <p className="text-terminal-red text-xs mb-2">{error}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-2.5 rounded font-semibold text-sm transition-colors ${
          !canSubmit
            ? 'bg-terminal-border text-terminal-muted cursor-not-allowed'
            : side === 'BUY'
              ? 'bg-terminal-green hover:bg-green-400 text-black'
              : 'bg-terminal-red hover:bg-red-400 text-white'
        }`}
      >
        {!hasValidSL
          ? 'Establece un Stop Loss'
          : !marginCheck.canOpen
            ? 'Margen insuficiente'
            : `${side === 'BUY' ? 'Comprar' : 'Vender'} ${size} ${activeSymbol}`}
      </button>

      {/* Risk warning modal */}
      <Modal
        isOpen={showRiskModal}
        onClose={() => {
          setShowRiskModal(false)
          setPendingSubmit(false)
        }}
        title="Advertencia de Riesgo"
      >
        <p className="text-terminal-muted text-sm mb-4">
          Esta operación arriesga el{' '}
          <strong className="text-terminal-red">{riskInfo?.riskPercent.toFixed(2)}%</strong> de tu
          cuenta (<strong>${riskInfo?.riskDollars.toFixed(2)}</strong>), por encima del límite
          recomendado del 2%.
        </p>
        <p className="text-terminal-muted text-xs mb-6">
          Los traders disciplinados limitan el riesgo por operación al 1-2% del capital total.
          ¿Deseas continuar de todas formas?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowRiskModal(false)
              setPendingSubmit(false)
            }}
            className="flex-1 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-text text-sm hover:border-terminal-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRiskConfirm}
            className="flex-1 py-2 bg-terminal-red hover:bg-red-400 rounded text-white text-sm font-semibold transition-colors"
          >
            Continuar
          </button>
        </div>
      </Modal>
    </div>
  )
}
