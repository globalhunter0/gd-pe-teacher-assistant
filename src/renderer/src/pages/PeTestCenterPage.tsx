import PageLayout, { PageHeader } from '../components/PageLayout'
import ExamBatchPage from './ExamBatchPage'
import ExamStandardsPage from './ExamStandardsPage'
import PeTestsPage from './PeTestsPage'
import {
  PE_TEST_CENTER_MODULE_LABEL,
  PE_TEST_CENTER_TABS,
  peTestCenterTabMeta,
  type PeTestCenterTab
} from '@shared/peTest/center'

interface PeTestCenterPageProps {
  tab: PeTestCenterTab
  onTabChange: (tab: PeTestCenterTab) => void
  openSessionId?: string | null
  onOpenSessionConsumed?: () => void
  prefillClassId?: string | null
  onPrefillClassConsumed?: () => void
  openEditorTab?: 'edit' | 'analysis'
  onOpenSession?: (sessionId: string, editorTab?: 'edit' | 'analysis') => void
}

export default function PeTestCenterPage({
  tab,
  onTabChange,
  openSessionId = null,
  onOpenSessionConsumed,
  prefillClassId = null,
  onPrefillClassConsumed,
  openEditorTab = 'edit',
  onOpenSession
}: PeTestCenterPageProps): React.JSX.Element {
  const meta = peTestCenterTabMeta(tab)

  function goToRecordsAndSession(sessionId: string): void {
    onTabChange('records')
    onOpenSession?.(sessionId, 'analysis')
  }

  return (
    <PageLayout className="page--pe-tests page-shell">
      <PageHeader icon="tests" title={PE_TEST_CENTER_MODULE_LABEL} description={meta.description} />
      <div className="pe-center-tabs" role="tablist" aria-label="体育测试">
        {PE_TEST_CENTER_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'pe-center-tab is-active' : 'pe-center-tab'}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'records' ? (
        <PeTestsPage
          embedded
          onRequestImport={() => onTabChange('import')}
          openSessionId={openSessionId}
          openEditorTab={openEditorTab}
          onOpenSessionConsumed={onOpenSessionConsumed}
          prefillClassId={prefillClassId}
          onPrefillClassConsumed={onPrefillClassConsumed}
        />
      ) : null}
      {tab === 'import' ? (
        <ExamBatchPage
          embedded
          entry="pe-tests"
          onBack={() => onTabChange('records')}
          onGoToTests={() => onTabChange('records')}
          onGoToAnalysis={goToRecordsAndSession}
        />
      ) : null}
      {tab === 'standards' ? <ExamStandardsPage embedded onOpenTools={() => onTabChange('tools')} /> : null}
      {tab === 'tools' ? (
        <ExamBatchPage
          embedded
          entry="standards-tool"
          onBack={() => onTabChange('standards')}
          onGoToTests={() => onTabChange('records')}
          onGoToAnalysis={goToRecordsAndSession}
        />
      ) : null}
    </PageLayout>
  )
}
