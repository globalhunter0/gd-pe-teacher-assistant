import { buildZip } from '../backup/zip'
import { CONTENT_CATEGORIES, LESSON_PART_LABELS, stageOfGrade } from '../curriculum/standards'
import { editionLabel, findEdition } from '../curriculum/textbooks'
import type { BigUnitDesign, CompetencyObjectives, LessonDesign, UnitDesign } from './types'

/** 7 列：顺序 | 时间 | 达成目标 | 教学内容 | 教师活动 | 学生活动 | 组织方法与学练要求（A4 去页边距约 9638 twip）。 */
const LESSON_COLUMNS = [760, 700, 1300, 1900, 1500, 1500, 1978]
const FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/>'

interface RunStyle {
  bold?: boolean
  size?: number
}

interface ParagraphStyle extends RunStyle {
  align?: 'center' | 'left'
  spacingAfter?: number
}

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function run(text: string, style: RunStyle = {}): string {
  const props = `<w:rPr>${FONT}${style.bold ? '<w:b/>' : ''}<w:sz w:val="${style.size ?? 21}"/><w:szCs w:val="${style.size ?? 21}"/></w:rPr>`
  const lines = text.split('\n')
  return lines
    .map((line, index) => `<w:r>${props}${index > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`)
    .join('')
}

function paragraph(text: string, style: ParagraphStyle = {}): string {
  const props = `<w:pPr><w:spacing w:after="${style.spacingAfter ?? 0}" w:line="300" w:lineRule="auto"/>${style.align === 'center' ? '<w:jc w:val="center"/>' : ''}</w:pPr>`
  return `<w:p>${props}${run(text, style)}</w:p>`
}

function cell(content: string, width: number, options: { span?: number; vMerge?: 'restart' | 'continue'; bold?: boolean; center?: boolean } = {}): string {
  const props = [
    `<w:tcW w:w="${width}" w:type="dxa"/>`,
    options.span && options.span > 1 ? `<w:gridSpan w:val="${options.span}"/>` : '',
    options.vMerge ? `<w:vMerge${options.vMerge === 'restart' ? ' w:val="restart"' : ''}/>` : '',
    '<w:vAlign w:val="center"/>'
  ].join('')
  const body = options.vMerge === 'continue' ? '<w:p/>' : paragraph(content, { bold: options.bold, align: options.center ? 'center' : 'left' })
  return `<w:tc><w:tcPr>${props}</w:tcPr>${body}</w:tc>`
}

function spanWidth(from: number, count: number, columns: number[]): number {
  return columns.slice(from, from + count).reduce((sum, value) => sum + value, 0)
}

function row(cells: string[]): string {
  return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`
}

function table(columns: number[], rows: string[]): string {
  const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')
  return [
    '<w:tbl>',
    `<w:tblPr><w:tblW w:w="${columns.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>`,
    `<w:tblGrid>${columns.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>`,
    ...rows,
    '</w:tbl>'
  ].join('')
}

function objectivesText(objectives: CompetencyObjectives): string {
  return [`1.运动能力：${objectives.sportAbility}`, `2.健康行为：${objectives.healthBehavior}`, `3.体育品德：${objectives.sportsMorality}`].join('\n')
}

function labelRow(label: string, value: string, columns: number[]): string {
  return row([cell(label, columns[0], { bold: true, center: true }), cell(value, spanWidth(1, columns.length - 1, columns), { span: columns.length - 1 })])
}

function wrapDocument(body: string): Buffer {
  const document = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body>`,
    '</w:document>'
  ].join('')
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  return buildZip([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(document, 'utf8') }
  ])
}

function loadText(lesson: LessonDesign): string {
  const load = lesson.load
  const parts = [
    load.groupDensityPct !== null ? `群体运动密度约 ${load.groupDensityPct}%` : '',
    load.individualDensityPct !== null ? `个体运动密度约 ${load.individualDensityPct}%` : '',
    load.avgHeartRate !== null ? `平均心率约 ${load.avgHeartRate} 次/分` : '',
    load.peakHeartRate !== null ? `最高心率约 ${load.peakHeartRate} 次/分` : '',
    load.fitnessMinutes !== null ? `体能练习 ${load.fitnessMinutes} 分钟` : ''
  ].filter(Boolean)
  return [parts.join('；'), load.note].filter(Boolean).join('\n')
}

/** 按广州市统一课时教案模板的版式生成课时教案 DOCX。 */
export function buildLessonDocx(lesson: LessonDesign): Buffer {
  const cols = LESSON_COLUMNS
  const senior = stageOfGrade(lesson.grade) === 'senior'
  const title = lesson.title.replace(/^第\d+课时\s*/, '')
  const header = `课次：第${lesson.lessonNo ?? '_'}课时　年级：${lesson.grade}　人数：男${lesson.maleCount ?? '____'}人、女${lesson.femaleCount ?? '____'}人　时间：${lesson.lessonMinutes}分钟`
  const rows: string[] = [
    labelRow('教学目标', objectivesText(lesson.objectives), cols),
    row([
      cell('教学内容', cols[0], { bold: true, center: true }),
      cell(lesson.content, spanWidth(1, 3, cols), { span: 3 }),
      cell(senior ? '安全防范措施' : '安全预案', cols[4], { bold: true, center: true }),
      cell(lesson.safetyPlan, spanWidth(5, 2, cols), { span: 2 })
    ]),
    row([
      cell('重点', cols[0], { bold: true, center: true }),
      cell(lesson.keyPoint, spanWidth(1, 3, cols), { span: 3 }),
      cell('难点', cols[4], { bold: true, center: true }),
      cell(lesson.difficulty, spanWidth(5, 2, cols), { span: 2 })
    ]),
    labelRow('教学流程', lesson.flow, cols),
    row(['顺序', '时间', '达成目标', '教学内容', '教师活动', '学生活动', '组织方法与学练要求'].map((label, index) => cell(label, cols[index], { bold: true, center: true })))
  ]
  lesson.segments.forEach((segment, index) => {
    const continues = index > 0 && lesson.segments[index - 1].part === segment.part
    const merged = lesson.segments.filter((item) => item.part === segment.part).length > 1
    const organization = [segment.organization ? `组织：${segment.organization}` : '', segment.requirements ? `要求：${segment.requirements}` : ''].filter(Boolean).join('\n')
    rows.push(
      row([
        cell(LESSON_PART_LABELS[segment.part], cols[0], { bold: true, center: true, vMerge: merged ? (continues ? 'continue' : 'restart') : undefined }),
        cell(`${segment.minutes} 分钟`, cols[1], { center: true }),
        cell(segment.goal, cols[2]),
        cell(segment.content, cols[3]),
        cell(segment.teacherActivities, cols[4]),
        cell(segment.studentActivities, cols[5]),
        cell(organization, cols[6])
      ])
    )
  })
  rows.push(labelRow('预计运动负荷', loadText(lesson), cols))
  rows.push(labelRow('场地器材', lesson.venueEquipment, cols))
  if (senior || lesson.reflection) {
    rows.push(labelRow('教学反思', lesson.reflection, cols))
  }
  return wrapDocument(
    [paragraph(`${title}课时教案`, { bold: true, size: 32, align: 'center', spacingAfter: 120 }), paragraph(header, { spacingAfter: 120 }), table(cols, rows)].join('')
  )
}

/** 大单元教学计划 + 各单元教学计划，导出为一个 DOCX。 */
export function buildBigUnitDocx(bigUnit: BigUnitDesign, units: ReadonlyArray<UnitDesign>): Buffer {
  const edition = findEdition(bigUnit.editionId)
  const category = CONTENT_CATEGORIES.find((item) => item.id === bigUnit.categoryId)
  const senior = stageOfGrade(bigUnit.grade) === 'senior'
  const infoCols = [1800, 7838]
  const body: string[] = [
    paragraph(`${bigUnit.title}${senior ? '模块教学计划' : '大单元教学计划'}`, { bold: true, size: 32, align: 'center', spacingAfter: 160 }),
    table(infoCols, [
      labelRow('年级 / 学期', `${bigUnit.grade}　${bigUnit.academicYear} ${bigUnit.semester}`, infoCols),
      labelRow('教材版本', edition ? editionLabel(edition) : '未指定', infoCols),
      labelRow('学习内容', `${category?.name ?? ''}　${bigUnit.sportItem}　共 ${bigUnit.totalLessons} 课时`, infoCols),
      labelRow('指导思想', bigUnit.guidingIdeas, infoCols),
      labelRow('学情分析', bigUnit.learnerAnalysis, infoCols),
      labelRow('教材分析', bigUnit.contentAnalysis, infoCols),
      labelRow('学习目标', objectivesText(bigUnit.objectives), infoCols),
      labelRow('教学重点', bigUnit.keyPoints, infoCols),
      labelRow('教学难点', bigUnit.difficulties, infoCols),
      labelRow('单元划分', bigUnit.unitOutline.map((item) => `${item.title}（第${item.lessonFrom}～${item.lessonTo}课时）：${item.focus}`).join('\n'), infoCols),
      labelRow('学习评价', bigUnit.assessment, infoCols),
      labelRow('安全保障', bigUnit.safety, infoCols)
    ])
  ]
  const scheduleCols = [900, 1900, 2600, 2438, 1800]
  for (const unit of units) {
    body.push(paragraph(''), paragraph(`${unit.title}单元教学计划（第${unit.lessonFrom}～${unit.lessonTo}课时）`, { bold: true, size: 24, spacingAfter: 80 }))
    body.push(
      table(infoCols, [
        labelRow('单元目标', objectivesText(unit.objectives), infoCols),
        labelRow('重点', unit.keyPoints, infoCols),
        labelRow('难点', unit.difficulties, infoCols),
        labelRow('评价', unit.assessment, infoCols)
      ])
    )
    body.push(paragraph(''))
    body.push(
      table(scheduleCols, [
        row(['课次', '课题', '主要学习内容', '练习与比赛', '评价要点'].map((label, index) => cell(label, scheduleCols[index], { bold: true, center: true }))),
        ...unit.lessonSchedule.map((item) =>
          row([
            cell(`第${item.lessonNo}课时`, scheduleCols[0], { center: true }),
            cell(item.topic, scheduleCols[1]),
            cell(item.content, scheduleCols[2]),
            cell(item.practiceAndCompetition, scheduleCols[3]),
            cell(item.assessment, scheduleCols[4])
          ])
        )
      ])
    )
  }
  return wrapDocument(body.join(''))
}

export function safeDocxFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 80)
  return `${cleaned || '教学设计'}.docx`
}
