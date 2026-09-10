import { useState } from 'react'
import { PAGE_DESCRIPTIONS, PAGE_TITLES, type NavKey } from './navigation'
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
import { UserPreferencesProvider } from './context/UserPreferencesContext'
import { TrainingProvider } from './context/TrainingContext'
import ClassStudentsPage from './pages/ClassStudentsPage'
import DashboardPage, { type PlanNavContext } from './pages/DashboardPage'
import PeLessonRecordsPage from './pages/PeLessonRecordsPage'
import PeTestsPage from './pages/PeTestsPage'
import SchedulePage from './pages/SchedulePage'
import StatsPage from './pages/StatsPage'
import TeachingPlansPage from './pages/TeachingPlansPage'
import ExamStandardsPage from './pages/ExamStandardsPage'
import TrainingTeamsPage from './pages/TrainingTeamsPage'
import ResourcesPage from './pages/ResourcesPage'
import SettingsPage from './pages/SettingsPage'
import type { PeSessionPrefill } from '@shared/peSession'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('exams')
  const [pePrefill, setPePrefill] = useState<PeSessionPrefill | null>(null)
  const [openTestSessionId, setOpenTestSessionId] = useState<string | null>(null)
  const [studentClassId, setStudentClassId] = useState<string | null>(null)
  const [testClassId, setTestClassId] = useState<string | null>(null)
  const [planContext, setPlanContext] = useState<PlanNavContext | null>(null)
  const [openTrainingTeamId, setOpenTrainingTeamId] = useState<string | null>(null)
  const [startTrainingSession, setStartTrainingSession] = useState(false)

  return (
    <UserPreferencesProvider>
    <ScheduleProvider>
      <ClassProvider>
        <TrainingProvider>
        <StudentProvider>
          <PeSessionProvider>
            <TestItemProvider>
              <PeTestProvider>
                <TeachingPlanProvider>
                  <ResourceProvider>
                  <div className="app-shell">
                    <Sidebar activeKey={activeKey} onNavigate={setActiveKey} />
                    <div className="app-main">
                      {activeKey === 'dashboard' ? (
                        <AppHeader title={PAGE_TITLES[activeKey]} description={PAGE_DESCRIPTIONS[activeKey]} />
                      ) : null}
                      <main className={activeKey === 'dashboard' ? 'app-content app-content--dashboard' : 'app-content app-content--workspace'}>
                        {activeKey === 'dashboard' ? (
                          <DashboardPage
                            onStartRecord={(prefill) => {
                              setPePrefill(prefill)
                              setActiveKey('lessons')
                            }}
                            onOpenStudents={(classId) => {
                              setStudentClassId(classId)
                              setActiveKey('students')
                            }}
                            onOpenTests={(classId) => {
                              setTestClassId(classId)
                              setActiveKey('tests')
                            }}
                            onOpenPlan={(context) => {
                              setPlanContext(context)
                              setActiveKey('plans')
                            }}
                            onNavigate={setActiveKey}
                          />
                        ) : activeKey === 'schedule' ? (
                          <SchedulePage />
                        ) : activeKey === 'classes' || activeKey === 'students' ? (
                          <ClassStudentsPage
                            initialClassId={studentClassId}
                            onInitialClassConsumed={() => setStudentClassId(null)}
                          />
                        ) : activeKey === 'lessons' ? (
                          <PeLessonRecordsPage prefill={pePrefill} onPrefillConsumed={() => setPePrefill(null)} />
                        ) : activeKey === 'plans' ? (
                          <TeachingPlansPage context={planContext} />
                        ) : activeKey === 'resources' ? (
                          <ResourcesPage />
                        ) : activeKey === 'tests' ? (
                          <PeTestsPage
                            openSessionId={openTestSessionId}
                            onOpenSessionConsumed={() => setOpenTestSessionId(null)}
                            prefillClassId={testClassId}
                            onPrefillClassConsumed={() => setTestClassId(null)}
                          />
                        ) : activeKey === 'training' ? (
                          <TrainingTeamsPage
                            openTeamId={openTrainingTeamId}
                            startSessionOnOpen={startTrainingSession}
                            onOpenTeamConsumed={() => {
                              setOpenTrainingTeamId(null)
                              setStartTrainingSession(false)
                            }}
                          />
                        ) : activeKey === 'exams' ? (
                          <ExamStandardsPage />
                        ) : activeKey === 'stats' ? (
                          <StatsPage
                            onOpenTest={(sessionId) => {
                              setOpenTestSessionId(sessionId)
                              setActiveKey('tests')
                            }}
                          />
                        ) : activeKey === 'settings' ? (
                          <SettingsPage />
                        ) : (
                          <PlaceholderPage title={PAGE_TITLES[activeKey]} pageKey={activeKey} />
                        )}
                      </main>
                    </div>
                  </div>
                  </ResourceProvider>
                </TeachingPlanProvider>
              </PeTestProvider>
            </TestItemProvider>
          </PeSessionProvider>
        </StudentProvider>
        </TrainingProvider>
      </ClassProvider>
    </ScheduleProvider>
    </UserPreferencesProvider>
  )
}
