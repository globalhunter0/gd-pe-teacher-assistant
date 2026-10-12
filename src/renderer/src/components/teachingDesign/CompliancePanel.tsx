import { countIssues, type ComplianceIssue } from '@shared/teachingDesign'

export default function CompliancePanel({ issues, standardTitle }: { issues: ComplianceIssue[]; standardTitle: string }): React.JSX.Element {
  const { errors, warnings } = countIssues(issues)
  return (
    <section className={`td-compliance ${errors > 0 ? 'is-error' : warnings > 0 ? 'is-warning' : 'is-ok'}`}>
      <h4>
        课标检查：
        {errors === 0 && warnings === 0 ? '符合要求' : `${errors} 项不符合，${warnings} 项提醒`}
      </h4>
      <p className="td-compliance-source">依据 {standardTitle}</p>
      {issues.length > 0 ? (
        <ul>
          {issues.map((issue, index) => (
            <li key={`${issue.field}-${index}`} className={issue.severity === 'error' ? 'is-error' : 'is-warning'}>
              {issue.severity === 'error' ? '不符合：' : '提醒：'}
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function GenerationBanner({ label, onCancel }: { label: string | null; onCancel: () => void }): React.JSX.Element | null {
  if (!label) {
    return null
  }
  return (
    <div className="td-generating" role="status">
      <span className="td-spinner" aria-hidden="true" />
      <span>{label}</span>
      <button type="button" className="btn btn-small" onClick={onCancel}>
        取消
      </button>
    </div>
  )
}
