import { useState } from 'react'
import { PAGE_TITLES, type NavKey } from './navigation'
import AppHeader from './components/AppHeader'
import PlaceholderPage from './components/PlaceholderPage'
import Sidebar from './components/Sidebar'
import { ClassProvider } from './context/ClassContext'
import { PeSessionProvider } from './context/PeSessionContext'
import { PeTestProvider } from './context/PeTestContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { StudentProvider } from './context/StudentContext'
import { TestItemProvider } from './context/TestItemContext'
import ClassManagementPage from './pages/ClassManagementPage'
import DashboardPage from './pages/DashboardPage'
import PeLessonRecordsPage from './pages/PeLessonRecordsPage'
import PeTestsPage from './pages/PeTestsPage'
import SchedulePage from './pages/SchedulePage'
import StudentManagementPage from './pages/StudentManagementPage'
import type { PeSessionPrefill } from '@shared/peSession'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('dashboard')
  const [pePrefill, setPePrefill] = useState<PeSessionPrefill | null>(null)

  return (
    <ScheduleProvider>
      <ClassProvider>
        <StudentProvider>
          <PeSessionProvider>
            <TestItemProvider>
              <PeTestProvider>
                <div className="app-shell">
                  <Sidebar activeKey={activeKey} onNavigate={setActiveKey} />
                  <div className="app-main">
                    <AppHeader />
                    <main className="app-content">
                      {activeKey === 'dashboard' ? (
                        <DashboardPage
                          onStartRecord={(prefill) => {
                            setPePrefill(prefill)
                            setActiveKey('lessons')
                          }}
                        />
                      ) : activeKey === 'schedule' ? (
                        <SchedulePage />
                      ) : activeKey === 'classes' ? (
                        <ClassManagementPage />
                      ) : activeKey === 'students' ? (
                        <StudentManagementPage />
                      ) : activeKey === 'lessons' ? (
                        <PeLessonRecordsPage prefill={pePrefill} onPrefillConsumed={() => setPePrefill(null)} />
                      ) : activeKey === 'tests' ? (
                        <PeTestsPage />
                      ) : (
                        <PlaceholderPage title={PAGE_TITLES[activeKey]} pageKey={activeKey} />
                      )}
                    </main>
                  </div>
                </div>
              </PeTestProvider>
            </TestItemProvider>
          </PeSessionProvider>
        </StudentProvider>
      </ClassProvider>
    </ScheduleProvider>
  )
}
