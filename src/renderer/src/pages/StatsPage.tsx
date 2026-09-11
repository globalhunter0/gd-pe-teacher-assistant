import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from '../components/PageLayout'
import StatsClassPanel from '../components/StatsClassPanel'
import StatsStudentPanel from '../components/StatsStudentPanel'
import StatsTestPanel from '../components/StatsTestPanel'
import TechEmptyState from '../components/workspace/TechEmptyState'
import { ModuleIcon } from '../components/workspace/ModuleIcon'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'

type StatsView = 'home' | 'class' | 'student' | 'test'

interface StatsPageProps {
  onOpenTest: (sessionId: string) => void
  initialView?: StatsView
  initialStudentId?: string | null
}

export default function StatsPage({ onOpenTest, initialView = 'home', initialStudentId = null }: StatsPageProps): React.JSX.Element {
  const [view, setView] = useState<StatsView>(initialView === 'home' && initialStudentId ? 'student' : initialView)
  const { sessions: lessons } = usePeSessions()
  const { sessions: tests } = usePeTests()
  const hasAnalyticsSource = lessons.length > 0 || tests.length > 0

  const entries = useMemo(
    () =>
      [
        {
          key: 'class' as const,
          title: '班级概览',
          description: '课堂考勤、最近测试，以及可解释的关注信号。'
        },
        {
          key: 'student' as const,
          title: '学生成长',
          description: '学生体育成长档案、项目卡片、同项目趋势和得分切换。'
        },
        {
          key: 'test' as const,
          title: '测试分析',
          description: '单次测试分析、相对满分分档，以及班级项目长期趋势。'
        }
      ],
    []
  )

  return (
    <PageLayout className="page--stats">
      <PageHeader
        icon="stats"
        title="数据统计"
        description="把已有课堂和测试记录变成可直接查看的数字。统计实时计算，不另外存一份结果，也不使用演示数据。"
        actions={
          view !== 'home' ? (
            <button type="button" className="btn" onClick={() => setView('home')}>
              返回入口
            </button>
          ) : undefined
        }
      />

      {view === 'home' ? (
        <>
          <div className="stats-home">
            {entries.map((item) => (
              <button key={item.key} type="button" className="stats-entry" onClick={() => setView(item.key)}>
                <span className="stats-entry-icon">
                  <ModuleIcon kind={item.key === 'class' ? 'students' : item.key === 'test' ? 'tests' : 'lessons'} size={18} />
                </span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <span className="stats-entry-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
          {hasAnalyticsSource ? null : (
            <TechEmptyState
              kind="stats"
              title="数据正在等待积累"
              description="完成课堂记录、体育测试等数据录入后，这里将自动形成统计分析。不会显示演示数值。"
            />
          )}
        </>
      ) : null}

      {view === 'class' ? <StatsClassPanel onOpenTest={onOpenTest} /> : null}
      {view === 'student' ? <StatsStudentPanel initialStudentId={initialStudentId} /> : null}
      {view === 'test' ? <StatsTestPanel onOpenTest={onOpenTest} /> : null}
    </PageLayout>
  )
}
