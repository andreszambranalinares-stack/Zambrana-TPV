import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAccountStore } from '@/store/accountStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ResetAccountModal({ isOpen, onClose }: Props) {
  const resetAccount = useAccountStore((s) => s.resetAccount)
  const [balance, setBalance] = useState('10000')

  function handleReset() {
    const val = parseFloat(balance)
    if (!isNaN(val) && val > 0) {
      resetAccount(val)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reiniciar cuenta paper">
      <p className="text-terminal-muted text-sm mb-4">
        Se borrarán todas las posiciones, operaciones y el historial. Esta acción no se puede deshacer.
      </p>
      <div className="mb-4">
        <label className="text-terminal-muted text-xs block mb-1">Balance inicial ($)</label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-accent"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-terminal-border rounded text-terminal-muted text-sm hover:text-terminal-text transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleReset}
          className="flex-1 py-2 bg-terminal-red hover:bg-red-400 rounded text-white text-sm font-semibold transition-colors"
        >
          Reiniciar
        </button>
      </div>
    </Modal>
  )
}
