import { useEffect, useId, useMemo, useState } from 'react'
import { DEFAULT_ACADEMIC_YEAR, GRADES, GRADE_LABELS, SEMESTERS, type Grade, type Semester } from '@shared/class'
import {
  CATEGORY_TEACHER_BOOK_KEYWORDS,
  DEFAULT_LESSON_MINUTES,
  GRADE_LEVEL,
  LEVEL_LABELS,
  categoriesForLevel,
  editionLabel,
  editionsForStage,
  findEdition,
  matchTeacherBook,
  stageOfGrade,
  stageRuleForGrade,
  type ContentCategoryId
} from '@shared/curriculum'
import { createTeachingDesignId, emptyObjectives, parseTeachingDesign, type BigUnitDesign } from '@shared/teachingDesign'
import { useResources } from '../../context/ResourceContext'

const MATERIAL_EXTENSIONS = /\.(txt|md|docx|pdf)$/i

interface Props {
  onClose: () => void
  onCreate: (bigUnit: BigUnitDesign, generate: boolean) => Promise<void>
}

export default function BigUnitCreateDialog({ onClose, onCreate }: Props): React.JSX.Element {
  const titleId = useId()
  const { resources } = useResources()
  const [grade, setGrade] = useState<Grade>('初一')
  const [semester, setSemester] = useState<Semester>('第一学期')
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR)
  const [editionId, setEditionId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<ContentCategoryId>('ball')
  const [sportItem, setSportItem] = useState('篮球')
  const [title, setTitle] = useState('')
  const [totalLessons, setTotalLessons] = useState('18')
  const [lessonMinutes, setLessonMinutes] = useState(String(DEFAULT_LESSON_MINUTES))
  const [notes, setNotes] = useState('')
  const [materialIds, setMaterialIds] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const level = GRADE_LEVEL[grade]
  const stage = stageOfGrade(grade)
  const categories = useMemo(() => categoriesForLevel(level), [level])
  const editions = useMemo(() => editionsForStage(stage), [stage])
  const category = categories.find((item) => item.id === categoryId) ?? null
  const edition = findEdition(editionId)
  const teacherBook = edition ? matchTeacherBook(edition, sportItem, CATEGORY_TEACHER_BOOK_KEYWORDS[categoryId]) : null
  const materials = resources.filter((item) => item.type === 'note' || (item.type === 'file' && MATERIAL_EXTENSIONS.test(item.originalFileName ?? '')))

  useEffect(() => {
    if (!categories.some((item) => item.id === categoryId)) {
      const first = categories.find((item) => item.specialized) ?? categories[0]
      setCategoryId(first.id)
      setSportItem(first.items[0] ?? '')
    }
  }, [categories, categoryId])

  useEffect(() => {
    if (editionId && !editions.some((item) => item.id === editionId)) {
      setEditionId('')
    }
  }, [editions, editionId])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function changeCategory(id: ContentCategoryId): void {
    setCategoryId(id)
    const next = categories.find((item) => item.id === id)
    setSportItem(next?.items[0] ?? '')
    if (next && !next.specialized && id !== 'fitness') {
      setTotalLessons(id === 'health' ? '4' : '6')
    } else {
      setTotalLessons('18')
    }
  }

  async function submit(generate: boolean): Promise<void> {
    const now = new Date().toISOString()
    setFormError(null)
    try {
      const draft = parseTeachingDesign({
        id: createTeachingDesignId(),
        kind: 'bigUnit',
        title: title.trim() || `${grade}${sportItem}${stage === 'senior' ? '模块' : '大单元'}`,
        notes,
        generation: null,
        createdAt: now,
        updatedAt: now,
        grade,
        academicYear,
        semester,
        editionId: editionId || null,
        categoryId,
        sportItem,
        totalLessons: Number(totalLessons),
        lessonMinutes: Number(lessonMinutes),
        teachingPlanId: null,
        materialResourceIds: materialIds,
        guidingIdeas: '',
        learnerAnalysis: '',
        contentAnalysis: '',
        objectives: emptyObjectives(),
        keyPoints: '',
        difficulties: '',
        unitOutline: [],
        assessment: '',
        safety: ''
      }) as BigUnitDesign
      setSaving(true)
      await onCreate(draft, generate)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '创建失败')
      setSaving(false)
    }
  }

  const rule = stageRuleForGrade(grade)
  const lessonsNum = Number(totalLessons)
  const lessonsHint =
    category?.specialized && stage === 'compulsory' && lessonsNum < rule.minUnitLessons
      ? `课标要求专项运动技能大单元不少于 ${rule.minUnitLessons} 课时`
      : stage === 'senior' && lessonsNum !== rule.minUnitLessons
        ? `高中 1 个模块一般为 ${rule.minUnitLessons} 课时`
        : null

  return (
    <div className="dialog-backdrop" onMouseDown={() => !saving && onClose()}>
      <div className="dialog dialog--plan-week" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <h3 id={titleId}>新建大单元教学设计</h3>
        <p className="dialog-slot">
          {LEVEL_LABELS[level]}。可选内容按{rule.standard.title}的课程内容结构列出；选择教材版本后会自动匹配对应教师用书分册。
        </p>
        <div className="dialog-grid">
          <label>
            年级 *
            <select value={grade} onChange={(event) => setGrade(event.target.value as Grade)}>
              {GRADES.map((item) => (
                <option key={item} value={item}>
                  {GRADE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            学期 *
            <select value={semester} onChange={(event) => setSemester(event.target.value as Semester)}>
              {SEMESTERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            学年 *
            <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
          </label>
          <label>
            教材版本
            <select value={editionId} onChange={(event) => setEditionId(event.target.value)}>
              <option value="">不指定（按课标编写）</option>
              {editions.map((item) => (
                <option key={item.id} value={item.id}>
                  {editionLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            课程内容类别 *
            <select value={categoryId} onChange={(event) => changeCategory(event.target.value as ContentCategoryId)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            运动项目 / 学习内容 *
            <input value={sportItem} list="td-sport-items" onChange={(event) => setSportItem(event.target.value)} />
            <datalist id="td-sport-items">
              {(category?.items ?? []).map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          {edition ? (
            <p className="dialog-span td-hint">{teacherBook ? `对应教师用书：《${teacherBook}》` : '该版本教师用书中未找到对应分册，将按课标要求编写。'}</p>
          ) : null}
          <label>
            总课时 *
            <input inputMode="numeric" value={totalLessons} onChange={(event) => setTotalLessons(event.target.value)} />
          </label>
          <label>
            每课时（分钟）*
            <input inputMode="numeric" value={lessonMinutes} onChange={(event) => setLessonMinutes(event.target.value)} />
          </label>
          {lessonsHint ? <p className="dialog-span td-hint is-warning">{lessonsHint}</p> : null}
          <label className="dialog-span">
            名称
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`${grade}${sportItem}${stage === 'senior' ? '模块' : '大单元'}`} />
          </label>
          <label className="dialog-span">
            学情、场地器材与补充要求（会提供给 AI）
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="例如：学生已学过原地运球；2 块篮球场，篮球 45 个；需融入中华传统体育元素" />
          </label>
          <fieldset className="dialog-span td-materials">
            <legend>参考教材 / 教参（来自资料中心，支持 txt、md、docx、文字版 pdf 和文字笔记）</legend>
            {materials.length === 0 ? (
              <p className="td-hint">资料中心还没有可用资料。可先到“资料中心”导入教材或教参文件。</p>
            ) : (
              materials.map((item) => (
                <label key={item.id} className="td-check">
                  <input
                    type="checkbox"
                    checked={materialIds.includes(item.id)}
                    onChange={(event) =>
                      setMaterialIds((current) => (event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
                    }
                  />
                  {item.title}
                  {item.originalFileName ? <span className="td-muted">（{item.originalFileName}）</span> : null}
                </label>
              ))
            )}
          </fieldset>
        </div>
        {formError ? <p className="dialog-error">{formError}</p> : null}
        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn" onClick={() => void submit(false)} disabled={saving}>
              创建空白
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void submit(true)} disabled={saving}>
              创建并 AI 生成
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
