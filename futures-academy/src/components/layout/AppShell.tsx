import { DisclaimerBanner } from './DisclaimerBanner'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

interface AppShellProps {
  currentRoute: string
  onNavigate: (route: string) => void
  children: React.ReactNode
}

export function AppShell({ currentRoute, onNavigate, children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DisclaimerBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav currentRoute={currentRoute} onNavigate={onNavigate} />
    </div>
  )
}
