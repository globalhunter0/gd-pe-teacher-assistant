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
import { TeachingPlanProvider } from './context/TeachingPlanContext'
import { ResourceProvider } from './context/ResourceContext'
import { TrainingProvider } from './context/TrainingContext'
import ClassManagementPage from './pages/ClassManagementPage'
import DashboardPage from './pages/DashboardPage'
import PeLessonRecordsPage from './pages/PeLessonRecordsPage'
import PeTestsPage from './pages/PeTestsPage'
import SchedulePage from './pages/SchedulePage'
import StatsPage from './pages/StatsPage'
import StudentManagementPage from './pages/StudentManagementPage'
import TeachingPlansPage from './pages/TeachingPlansPage'
import ExamStandardsPage from './pages/ExamStandardsPage'
import TrainingTeamsPage from './pages/TrainingTeamsPage'
import ResourcesPage from './pages/ResourcesPage'
import type { PeSessionPrefill } from '@shared/peSession'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('dashboard')
  const [pePrefill, setPePrefill] = useState<PeSessionPrefill | null>(null)
  const [openTestSessionId, setOpenTestSessionId] = useState<string | null>(null)

  return (
    <ScheduleProvider>
      <ClassProvider>
        <StudentProvider>
          <PeSessionProvider>
            <TestItemProvider>
              <PeTestProvider>
                <TeachingPlanProvider>
                  <ResourceProvider>
                  <TrainingProvider>
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
                        ) : activeKey === 'plans' ? (
                          <TeachingPlansPage />
                        ) : activeKey === 'resources' ? (
                          <ResourcesPage />
                        ) : activeKey === 'tests' ? (
                          <PeTestsPage
                            openSessionId={openTestSessionId}
                            onOpenSessionConsumed={() => setOpenTestSessionId(null)}
                          />
                        ) : activeKey === 'training' ? (
                          <TrainingTeamsPage />
                        ) : activeKey === 'exams' ? (
                          <ExamStandardsPage />
                        ) : activeKey === 'stats' ? (
                          <StatsPage
                            onOpenTest={(sessionId) => {
                              setOpenTestSessionId(sessionId)
                              setActiveKey('tests')
                            }}
                          />
                        ) : (
                          <PlaceholderPage title={PAGE_TITLES[activeKey]} pageKey={activeKey} />
                        )}
                      </main>
                    </div>
                  </div>
                  </TrainingProvider>
                  </ResourceProvider>
                </TeachingPlanProvider>
              </PeTestProvider>
            </TestItemProvider>
          </PeSessionProvider>
        </StudentProvider>
      </ClassProvider>
    </ScheduleProvider>
  )
}
