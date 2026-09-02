import { useState } from 'react'
import { PAGE_TITLES, type NavKey } from './navigation'
import AppHeader from './components/AppHeader'
import PlaceholderPage from './components/PlaceholderPage'
import Sidebar from './components/Sidebar'
import { ClassProvider } from './context/ClassContext'
import { ScheduleProvider } from './context/ScheduleContext'
import ClassManagementPage from './pages/ClassManagementPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('dashboard')

  return (
    <ScheduleProvider>
      <ClassProvider>
        <div className="app-shell">
          <Sidebar activeKey={activeKey} onNavigate={setActiveKey} />
          <div className="app-main">
            <AppHeader />
            <main className="app-content">
              {activeKey === 'dashboard' ? (
                <DashboardPage />
              ) : activeKey === 'schedule' ? (
                <SchedulePage />
              ) : activeKey === 'classes' ? (
                <ClassManagementPage />
              ) : (
                <PlaceholderPage title={PAGE_TITLES[activeKey]} pageKey={activeKey} />
              )}
            </main>
          </div>
        </div>
      </ClassProvider>
    </ScheduleProvider>
  )
}
