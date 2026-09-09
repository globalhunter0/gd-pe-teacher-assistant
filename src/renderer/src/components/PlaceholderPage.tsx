import { PAGE_DESCRIPTIONS, type NavKey } from '../navigation'
import PageLayout, { PageHeader } from './PageLayout'
import TechEmptyState from './workspace/TechEmptyState'

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
    <PageLayout>
      <PageHeader icon="ai" title={title} description={PAGE_DESCRIPTIONS[pageKey]} />
      <TechEmptyState
        kind="ai"
        title="功能开发中"
        description="当前版本已完成应用框架与页面入口，具体业务功能将在后续阶段逐步加入。"
      />
    </PageLayout>
  )
}
