import { useState } from 'react'
import { listedClassRecords } from '@shared/class'
import {
  buildExamTemplatePayload,
  templateItemColumns,
  type ExamWorkbookSavePayload
} from '@shared/examBatch'
import { standardAllowsOfficialConvert, type ExamStandard } from '@shared/examStandard'
import type { StudentGender } from '@shared/student'
import { useClasses } from '../context/ClassContext'
import { useStudents } from '../context/StudentContext'
import { getAppApi } from '../platform/appApi'

const CONVERT_TABLE_HINT = '该城市/年度评分表尚未完整核验，暂不支持自动换算。'

function templateGenderLabel(gender: StudentGender): string {
  if (gender === 'male') {
    return '男'
  }
  if (gender === 'female') {
    return '女'
  }
  return ''
}

export default function ExamTemplateActions({ standard }: { standard: ExamStandard | null }): React.JSX.Element {
  const { classes } = useClasses()
  const { students } = useStudents()
  const [templateClassId, setTemplateClassId] = useState('')
  const [templateBusy, setTemplateBusy] = useState(false)
  const [templateMessage, setTemplateMessage] = useState<string | null>(null)
  const officialConvertAllowed = standard ? standardAllowsOfficialConvert(standard) : false
  const templateColumns = standard ? templateItemColumns(standard) : []

  async function saveTemplate(payload: ExamWorkbookSavePayload): Promise<void> {
    setTemplateMessage(null)
    setTemplateBusy(true)
    try {
      const result = await (await getAppApi()).examBatch.saveWorkbook(payload)
      if (result.canceled) {
        return
      }
      setTemplateMessage(`已保存：${result.filePath}`)
    } catch (error) {
      setTemplateMessage(error instanceof Error ? error.message : '无法保存模板')
    } finally {
      setTemplateBusy(false)
    }
  }

  function officialConvertBlockMessage(target: ExamStandard): string {
    return target.scoreTableStatus !== 'verified' ? CONVERT_TABLE_HINT : '当前标准未完整核验，不能生成用于正式换算的成绩模板。'
  }

  function handleDownloadBlankTemplate(): void {
    if (!standard) {
      setTemplateMessage('请先选择地区、年份和考试类型')
      return
    }
    if (!standardAllowsOfficialConvert(standard)) {
      setTemplateMessage(officialConvertBlockMessage(standard))
      return
    }
    void saveTemplate(
      buildExamTemplatePayload({
        standard,
        generatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    )
  }

  function handleDownloadClassTemplate(): void {
    if (!standard) {
      setTemplateMessage('请先选择地区、年份和考试类型')
      return
    }
    if (!standardAllowsOfficialConvert(standard)) {
      setTemplateMessage(officialConvertBlockMessage(standard))
      return
    }
    const selectedClass = classes.find((item) => item.id === templateClassId)
    if (!selectedClass) {
      setTemplateMessage('请选择要生成模板的班级')
      return
    }
    const roster = students.filter((student) => student.classId === selectedClass.id && student.status === 'active')
    void saveTemplate(
      buildExamTemplatePayload({
        standard,
        className: selectedClass.className,
        generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        students: roster.map((student) => ({
          name: student.name,
          studentNo: student.studentNo,
          className: selectedClass.className,
          genderLabel: templateGenderLabel(student.gender)
        }))
      })
    )
  }

  return (
    <div className="exam-detail">
      <h3>模板</h3>
      <p className="exam-notes">独立评分与模板工具，不一定写入体育测试。下载模板或按班级生成后，可在本页评分并选择是否保存到体育测试。</p>
      {standard ? (
        <p className="exam-notes">
          当前标准：{standard.title}。可自动换算项目列：
          {templateColumns.length === 0
            ? '无（没有 verified + 支持自动换算的项目，不会写入成绩列）'
            : templateColumns.map((column) => column.header).join('、')}
        </p>
      ) : (
        <p className="exam-notes">请先选择地区、年份和考试类型后再下载模板。</p>
      )}
      {standard && !officialConvertAllowed ? <p className="page-error">{CONVERT_TABLE_HINT}</p> : null}
      <div className="toolbar">
        <button type="button" className="btn" onClick={handleDownloadBlankTemplate} disabled={templateBusy || !standard || !officialConvertAllowed}>
          下载空白模板
        </button>
        <label className="toolbar-field">
          班级
          <select value={templateClassId} onChange={(event) => setTemplateClassId(event.target.value)}>
            <option value="">选择班级</option>
            {listedClassRecords(classes).map((item) => (
              <option key={item.id} value={item.id}>
                {item.className}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          onClick={handleDownloadClassTemplate}
          disabled={templateBusy || !standard || !officialConvertAllowed || templateClassId === ''}
        >
          按班级生成模板
        </button>
      </div>
      {templateMessage ? <p className="exam-notes">{templateMessage}</p> : null}
    </div>
  )
}
