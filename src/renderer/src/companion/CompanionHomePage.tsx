import PageLayout from '../components/PageLayout'
import type { CompanionNavKey } from './companionNav'
import { useUserPreferences } from '../context/UserPreferencesContext'
import { useClasses } from '../context/ClassContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { listedClassRecords } from '@shared/class'

interface CompanionHomePageProps {
  onNavigate: (key: CompanionNavKey) => void
}

export default function CompanionHomePage({ onNavigate }: CompanionHomePageProps): React.JSX.Element {
  const { preferences } = useUserPreferences()
  const { classes } = useClasses()
  const { students } = useStudents()
  const { sessions } = usePeTests()
  const classCount = listedClassRecords(classes).length
  const studentCount = students.filter((item) => item.status === 'active').length
  const testCount = sessions.length
  const name = preferences.teacherDisplayName.trim() || '老师'

  return (
    <PageLayout className="page--companion-home page-shell">
      <div className="companion-home">
        <p className="companion-home-kicker">广东省初中体育教师管理助手 · 免费网页版</p>
        <h2 className="companion-home-title">你好，{name}</h2>
        <p className="companion-home-lead">
          在手机上看课表、记课堂考勤、查评分标准、录体育成绩。Excel 批量导入和整库备份请继续用 Windows 桌面版。
        </p>
        <div className="companion-home-stats">
          <div>
            <strong>{classCount}</strong>
            <span>班级</span>
          </div>
          <div>
            <strong>{studentCount}</strong>
            <span>在读学生</span>
          </div>
          <div>
            <strong>{testCount}</strong>
            <span>测试记录</span>
          </div>
        </div>
        <div className="companion-home-actions">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('schedule')}>
            课表工作台
          </button>
          <button type="button" className="btn" onClick={() => onNavigate('lessons')}>
            课堂考勤
          </button>
          <button type="button" className="btn" onClick={() => onNavigate('standards')}>
            查评分标准
          </button>
          <button type="button" className="btn" onClick={() => onNavigate('tests')}>
            体育测试 / 快速录入
          </button>
          <button type="button" className="btn" onClick={() => onNavigate('sync')}>
            从电脑同步数据
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
