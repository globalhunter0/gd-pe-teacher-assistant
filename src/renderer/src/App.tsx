import { useState } from 'react'
import { PAGE_TITLES, type NavKey } from './navigation'
import AppHeader from './components/AppHeader'
import PlaceholderPage from './components/PlaceholderPage'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('dashboard')

  return (
    <div className="app-shell">
      <Sidebar activeKey={activeKey} onNavigate={setActiveKey} />
      <div className="app-main">
        <AppHeader />
        <main className="app-content">
          {activeKey === 'dashboard' ? (
            <DashboardPage />
          ) : (
            <PlaceholderPage title={PAGE_TITLES[activeKey]} pageKey={activeKey} />
          )}
        </main>
      </div>
    </div>
  )
}
