import { useEffect, useState } from 'react'
import { PAGE_DESCRIPTIONS, PAGE_TITLES, resolveAppNavigation, type NavKey } from './navigation'
import { PE_TEST_CENTER_DEFAULT_TAB, type PeTestCenterTab } from '@shared/peTest/center'
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
import PeTestCenterPage from './pages/PeTestCenterPage'
import SchedulePage from './pages/SchedulePage'
import StatsPage from './pages/StatsPage'
import TeachingPlansPage from './pages/TeachingPlansPage'
import TrainingTeamsPage from './pages/TrainingTeamsPage'
import ResourcesPage from './pages/ResourcesPage'
import SettingsPage from './pages/SettingsPage'
import type { PeSessionPrefill } from '@shared/peSession'

export default function App(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<NavKey>('dashboard')
  const [peTestTab, setPeTestTab] = useState<PeTestCenterTab>(PE_TEST_CENTER_DEFAULT_TAB)
  const [pePrefill, setPePrefill] = useState<PeSessionPrefill | null>(null)
  const [openPeSessionId, setOpenPeSessionId] = useState<string | null>(null)
  const [openTestSessionId, setOpenTestSessionId] = useState<string | null>(null)
  const [openTestEditorTab, setOpenTestEditorTab] = useState<'edit' | 'analysis'>('edit')
  const [statsStudentId, setStatsStudentId] = useState<string | null>(null)
  const [studentClassId, setStudentClassId] = useState<string | null>(null)
  const [testClassId, setTestClassId] = useState<string | null>(null)
  const [planContext, setPlanContext] = useState<PlanNavContext | null>(null)
  const [openTrainingTeamId, setOpenTrainingTeamId] = useState<string | null>(null)
  const [startTrainingSession, setStartTrainingSession] = useState(false)
  const [startupHealthError, setStartupHealthError] = useState<string | null>(null)

  function navigate(key: string): void {
    const next = resolveAppNavigation(key)
    setActiveKey(next.key)
    if (next.key === 'tests') {
      setPeTestTab(next.peTestTab ?? PE_TEST_CENTER_DEFAULT_TAB)
    }
  }

  function goToExistingLesson(sessionId: string): void {
    setPePrefill(null)
    setOpenPeSessionId(sessionId)
    setActiveKey('lessons')
  }

  function goToNewLesson(prefill: PeSessionPrefill): void {
    setOpenPeSessionId(null)
    setPePrefill(prefill)
    setActiveKey('lessons')
  }

  useEffect(() => {
    if (activeKey === 'exams') {
      setActiveKey('tests')
      setPeTestTab('standards')
    }
  }, [activeKey])

  useEffect(() => {
    void window.electronAPI.dataIntegrity.startupStatus().then((report) => {
      if (report && report.status === 'error') {
        setStartupHealthError(
          `启动自检发现数据错误 ${report.issueCount.error} 项。应用仍可打开；请到「设置 / 备份与恢复」查看明细，损坏文件不会被自动清空。`
        )
      }
    })
  }, [])

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
                    <Sidebar activeKey={activeKey === 'exams' ? 'tests' : activeKey} onNavigate={navigate} />
                    <div className="app-main">
                      {startupHealthError ? (
                        <div className="data-integrity-banner data-integrity-banner--error" role="alert">
                          {startupHealthError}{' '}
                          <button type="button" className="btn btn-small" onClick={() => setActiveKey('settings')}>
                            打开设置
                          </button>
                        </div>
                      ) : null}
                      {activeKey === 'dashboard' ? (
                        <AppHeader title={PAGE_TITLES[activeKey]} description={PAGE_DESCRIPTIONS[activeKey]} />
                      ) : null}
                      <main className={activeKey === 'dashboard' ? 'app-content app-content--dashboard' : 'app-content app-content--workspace'}>
                        {activeKey === 'dashboard' ? (
                          <DashboardPage
                            onStartRecord={goToNewLesson}
                            onOpenSession={goToExistingLesson}
                            onOpenStudents={(classId) => {
                              setStudentClassId(classId)
                              setActiveKey('students')
                            }}
                            onOpenTests={(classId) => {
                              setTestClassId(classId)
                              setPeTestTab(PE_TEST_CENTER_DEFAULT_TAB)
                              setActiveKey('tests')
                            }}
                            onOpenPlan={(context) => {
                              setPlanContext(context)
                              setActiveKey('plans')
                            }}
                            onNavigate={(key) => navigate(key)}
                          />
                        ) : activeKey === 'schedule' ? (
                          <SchedulePage onStartRecord={goToNewLesson} onOpenSession={goToExistingLesson} />
                        ) : activeKey === 'classes' || activeKey === 'students' ? (
                          <ClassStudentsPage
                            initialClassId={studentClassId}
                            onInitialClassConsumed={() => setStudentClassId(null)}
                            onOpenGrowth={(studentId) => {
                              setStatsStudentId(studentId)
                              setActiveKey('stats')
                            }}
                          />
                        ) : activeKey === 'lessons' ? (
                          <PeLessonRecordsPage
                            prefill={pePrefill}
                            onPrefillConsumed={() => setPePrefill(null)}
                            openSessionId={openPeSessionId}
                            onOpenSessionConsumed={() => setOpenPeSessionId(null)}
                          />
                        ) : activeKey === 'plans' ? (
                          <TeachingPlansPage context={planContext} onOpenSession={goToExistingLesson} />
                        ) : activeKey === 'resources' ? (
                          <ResourcesPage />
                        ) : activeKey === 'tests' || activeKey === 'exams' ? (
                          <PeTestCenterPage
                            tab={activeKey === 'exams' ? 'standards' : peTestTab}
                            onTabChange={setPeTestTab}
                            openSessionId={openTestSessionId}
                            openEditorTab={openTestEditorTab}
                            onOpenSessionConsumed={() => {
                              setOpenTestSessionId(null)
                              setOpenTestEditorTab('edit')
                            }}
                            prefillClassId={testClassId}
                            onPrefillClassConsumed={() => setTestClassId(null)}
                            onOpenSession={(sessionId, editorTab = 'analysis') => {
                              setOpenTestSessionId(sessionId)
                              setOpenTestEditorTab(editorTab)
                              setPeTestTab(PE_TEST_CENTER_DEFAULT_TAB)
                            }}
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
                        ) : activeKey === 'stats' ? (
                          <StatsPage
                            initialStudentId={statsStudentId}
                            onOpenTest={(sessionId) => {
                              setOpenTestSessionId(sessionId)
                              setOpenTestEditorTab('edit')
                              setPeTestTab(PE_TEST_CENTER_DEFAULT_TAB)
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
