import { useState } from 'react'
import StatsClassPanel from '../components/StatsClassPanel'
import StatsStudentPanel from '../components/StatsStudentPanel'
import StatsTestPanel from '../components/StatsTestPanel'

type StatsView = 'home' | 'class' | 'student' | 'test'

interface StatsPageProps {
  onOpenTest: (sessionId: string) => void
}

export default function StatsPage({ onOpenTest }: StatsPageProps): React.JSX.Element {
  const [view, setView] = useState<StatsView>('home')

  return (
    <section className="page page--stats">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>数据统计</h2>
          <p>把已有课堂和测试记录变成教师可直接查看的数字。统计实时计算，不另外存一份结果。</p>
        </div>
        {view !== 'home' ? (
          <div className="page-actions">
            <button type="button" className="btn" onClick={() => setView('home')}>
              返回入口
            </button>
          </div>
        ) : null}
      </div>

      {view === 'home' ? (
        <div className="stats-home">
          <button type="button" className="stats-entry" onClick={() => setView('class')}>
            <strong>班级概览</strong>
            <span>按班级查看体育课次数、考勤人次和表现标签次数。</span>
          </button>
          <button type="button" className="stats-entry" onClick={() => setView('student')}>
            <strong>学生档案</strong>
            <span>按学生查看课堂摘要、各项目首次/最近/最好成绩和较首次变化。</span>
          </button>
          <button type="button" className="stats-entry" onClick={() => setView('test')}>
            <strong>测试统计</strong>
            <span>按班级和项目查看各次测试的有效、缺测等记录人次、平均和最好成绩。</span>
          </button>
        </div>
      ) : null}

      {view === 'class' ? <StatsClassPanel onOpenTest={onOpenTest} /> : null}
      {view === 'student' ? <StatsStudentPanel /> : null}
      {view === 'test' ? <StatsTestPanel onOpenTest={onOpenTest} /> : null}
    </section>
  )
}
