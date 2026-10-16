import { useState } from 'react'
import { COMPANION_NAV_ITEMS, type CompanionNavKey } from './companionNav'
import { ClassProvider } from '../context/ClassContext'
import { PeSessionProvider } from '../context/PeSessionContext'
import { PeTestProvider } from '../context/PeTestContext'
import { ScheduleProvider } from '../context/ScheduleContext'
import { StudentProvider } from '../context/StudentContext'
import { TestItemProvider } from '../context/TestItemContext'
import { TrainingProvider } from '../context/TrainingContext'
import { UserPreferencesProvider } from '../context/UserPreferencesContext'
import ClassStudentsPage from '../pages/ClassStudentsPage'
import ExamStandardsPage from '../pages/ExamStandardsPage'
import PeTestsPage from '../pages/PeTestsPage'
import CompanionHomePage from './CompanionHomePage'
import CompanionSyncPage from './CompanionSyncPage'

function CompanionShell(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState<CompanionNavKey>('home')
  const [openTestSessionId, setOpenTestSessionId] = useState<string | null>(null)

  return (
    <div className="app-shell companion-shell">
      <div className="companion-banner" role="status">
        免费网页版 · 数据仅保存在本机浏览器 · 完整功能请用 Windows 桌面版
      </div>
      <div className="app-main companion-main">
        <main className="app-content app-content--workspace">
          {activeKey === 'home' ? <CompanionHomePage onNavigate={setActiveKey} /> : null}
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
              <TestItemProvider>
                <PeTestProvider>
                  <CompanionShell />
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
