import StatCard from '../components/StatCard'

export default function DashboardPage(): React.JSX.Element {
  return (
    <section className="page">
      <div className="page-heading">
        <h2>工作台</h2>
        <p>欢迎使用广东省初中体育教师管理助手。当前为占位数据，后续将连接本地数据。</p>
      </div>

      <div className="stat-grid">
        <StatCard label="今日课程" value="0 节" hint="尚未录入今日课表" />
        <StatCard label="本周课时" value="0 节" hint="本周暂无课时记录" />
        <StatCard label="待办事项" value="0 项" hint="当前没有待处理事项" />
        <StatCard label="班级数量" value="0 个" hint="尚未添加任教班级" />
      </div>

      <div className="info-panel">
        <h3>使用说明</h3>
        <ul>
          <li>左侧导航可进入各功能模块，当前版本仅提供页面框架。</li>
          <li>本软件面向 Windows 11 本地使用，数据将保存在本机，不依赖登录或云服务。</li>
          <li>后续将逐步加入课表、班级、学生、测试成绩、Excel 导入导出和本地备份。</li>
        </ul>
      </div>
    </section>
  )
}
