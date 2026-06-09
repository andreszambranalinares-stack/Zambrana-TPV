import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TerminalPage } from '@/pages/TerminalPage'
import { AccountPage } from '@/pages/AccountPage'
import { JournalPage } from '@/pages/JournalPage'
import { AcademyPage } from '@/pages/AcademyPage'
import { ReplayPage } from '@/pages/ReplayPage'

function getRouteFromHash(): string {
  const hash = window.location.hash.replace('#/', '') || 'terminal'
  return hash
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash)

  useEffect(() => {
    const handler = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (path: string) => {
    window.location.hash = `#/${path}`
    setRoute(path)
  }

  function renderPage() {
    switch (route) {
      case 'terminal': return <TerminalPage />
      case 'cuenta': return <AccountPage />
      case 'diario': return <JournalPage />
      case 'academia': return <AcademyPage />
      case 'replay': return <ReplayPage />
      default: return <TerminalPage />
    }
  }

  return (
    <AppShell currentRoute={route} onNavigate={navigate}>
      {renderPage()}
    </AppShell>
  )
}
