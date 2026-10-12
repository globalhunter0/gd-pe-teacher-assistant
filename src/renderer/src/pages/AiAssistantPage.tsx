import AiModelSettingsCard from '../components/AiModelSettingsCard'
import PageLayout, { PageHeader } from '../components/PageLayout'

export default function AiAssistantPage({ onOpenTeachingDesign }: { onOpenTeachingDesign: () => void }): React.JSX.Element {
  return (
    <PageLayout className="page--ai">
      <PageHeader
        icon="ai"
        title="AI 助手"
        description="配置用于教学设计的大模型服务。API Key 经系统加密保存在本机，不进入备份包。"
      />

      <div className="settings-grid">
        <AiModelSettingsCard />

        <article className="info-panel">
          <h3>教学设计生成</h3>
          <p className="settings-copy">
            完成模型配置并测试连接后，可在“教学计划 → 大单元教学设计（AI）”中生成大单元教学计划、单元教学计划和广州市统一模板课时教案。
          </p>
          <ol>
            <li>在本页选择服务商、模型并测试连接。</li>
            <li>需要参考教材或教参时，先到资料中心导入文件。</li>
            <li>进入大单元教学设计，创建大单元并开始生成。</li>
          </ol>
          <button type="button" className="btn btn-primary" onClick={onOpenTeachingDesign}>
            前往大单元教学设计
          </button>
        </article>
      </div>
    </PageLayout>
  )
}
