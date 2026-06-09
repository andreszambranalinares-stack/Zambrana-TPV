import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'warning' | 'success' | 'info'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, type, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  const colors = {
    error: 'bg-red-900/80 border-terminal-red text-red-200',
    warning: 'bg-yellow-900/80 border-yellow-600 text-yellow-200',
    success: 'bg-green-900/80 border-terminal-green text-green-200',
    info: 'bg-blue-900/80 border-terminal-accent text-blue-200',
  }

  return (
    <div className={`fixed bottom-20 lg:bottom-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-xl text-sm max-w-sm ${colors[type]}`}>
      {message}
    </div>
  )
}
