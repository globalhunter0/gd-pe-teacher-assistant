import { PAGE_DESCRIPTIONS, type NavKey } from '../navigation'

interface PlaceholderPageProps {
  title: string
  description?: string
  pageKey: NavKey
}

export default function PlaceholderPage({
  title,
  pageKey
}: PlaceholderPageProps): React.JSX.Element {
  return (
    <section className="page">
      <div className="page-heading">
        <h2>{title}</h2>
        <p>{PAGE_DESCRIPTIONS[pageKey]}</p>
      </div>
      <div className="empty-panel">
        <p className="empty-title">功能开发中</p>
        <p className="empty-text">当前版本已完成应用框架与页面入口，具体业务功能将在后续阶段逐步加入。</p>
      </div>
    </section>
  )
}
