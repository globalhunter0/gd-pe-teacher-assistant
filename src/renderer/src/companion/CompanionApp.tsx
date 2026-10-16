import { useState } from 'react'
import type { PeSessionPrefill } from '@shared/peSession'
import { COMPANION_NAV_ITEMS, type CompanionNavKey } from './companionNav'
import { ClassProvider } from '../context/ClassContext'
import { PeSessionProvider } from '../context/PeSessionContext'
import { PeTestProvider } from '../context/PeTestContext'
import { ScheduleProvider } from '../context/ScheduleContext'
import { StudentProvider } from '../context/StudentContext'
import { TeachingPlanProvider } from '../context/TeachingPlanContext'
import { TestItemProvider } from '../context/TestItemContext'
import { TrainingProvider } from '../context/TrainingContext'
import { UserPreferencesProvider } from '../context/UserPreferencesContext'
import ClassStudentsPage from '../pages/ClassStudentsPage'
import ExamStandardsPage from '../pages/ExamStandardsPage'
import PeLessonRecordsPage from '../pages/PeLessonRecordsPage'
import PeTestsPage from '../pages/PeTestsPage'
import SchedulePage from '../pages/SchedulePage'
import CompanionHomePage from './CompanionHomePage'
import CompanionSyncPage from './CompanionSyncPage'

function CompanionShell(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<CompanionNavKey>('home')
  const [openTestSessionId, setOpenTestSessionId] = useState<string | null>(null)
  const [pePrefill, setPePrefill] = useState<PeSessionPrefill | null>(null)
  const [openPeSessionId, setOpenPeSessionId] = useState<string | null>(null)

  function openLesson(prefill: PeSessionPrefill): void {
    setPePrefill(prefill)
    setOpenPeSessionId(null)
    setActiveKey('lessons')
  }

  function openExistingLesson(sessionId: string): void {
    setPePrefill(null)
    setOpenPeSessionId(sessionId)
    setActiveKey('lessons')
  }

  return (
    <div className="app-shell companion-shell">
      <div className="companion-banner" role="status">
        免费网页版 · 数据只保存在这台手机的浏览器里 · 完整备份请用 Windows 桌面版
      </div>
      <div className="app-main companion-main">
        <main className="app-content app-content--workspace">
          {activeKey === 'home' ? <CompanionHomePage onNavigate={setActiveKey} /> : null}
          {activeKey === 'schedule' ? (
            <SchedulePage hideExcelImport onStartRecord={openLesson} onOpenSession={openExistingLesson} />
          ) : null}
          {activeKey === 'lessons' ? (
            <PeLessonRecordsPage
              prefill={pePrefill}
              onPrefillConsumed={() => setPePrefill(null)}
              openSessionId={openPeSessionId}
              onOpenSessionConsumed={() => setOpenPeSessionId(null)}
            />
          ) : null}
          {activeKey === 'students' ? <ClassStudentsPage hideExcelImport /> : null}
          {activeKey === 'tests' ? (
            <PeTestsPage
              openSessionId={openTestSessionId}
              onOpenSessionConsumed={() => setOpenTestSessionId(null)}
            />
          ) : null}
          {activeKey === 'standards' ? <ExamStandardsPage /> : null}
          {activeKey === 'sync' ? <CompanionSyncPage /> : null}
        </main>
      </div>
      <nav className="companion-tabbar" aria-label="网页版导航">
        {COMPANION_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeKey === item.key ? 'companion-tab is-active' : 'companion-tab'}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function CompanionApp(): React.JSX.Element {
  return (
    <UserPreferencesProvider>
      <ScheduleProvider>
        <ClassProvider>
          <TrainingProvider>
            <StudentProvider>
              <PeSessionProvider>
                <TeachingPlanProvider>
                  <TestItemProvider>
                    <PeTestProvider>
                      <CompanionShell />
                    </PeTestProvider>
                  </TestItemProvider>
                </TeachingPlanProvider>
              </PeSessionProvider>
            </StudentProvider>
          </TrainingProvider>
        </ClassProvider>
      </ScheduleProvider>
    </UserPreferencesProvider>
  )
}
