import { parseClassLabel } from './classLabel'
import { buildIncomingFromDetectedWorkbook, detectStudentRosterWorkbook } from './detectRoster'
import type { WorkbookSheetInput } from './detectTypes'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function sheet(name: string, rows: string[][]): WorkbookSheetInput {
  return { name, rows }
}

export function runRosterAutoDetectionSelfCheck(): void {
  const names = ['张三', '李四', '王五', '赵六']

  const standard = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('Sheet1', [
      ['姓名', '学号', '性别', '班级'],
      ['张三', '01', '男', '初一1班'],
      ['李四', '02', '女', '初一1班']
    ])
  ])
  assert(standard.tables[0]?.headerRowNumber === 1, '1. 标准表头应识别第1行')
  assert(standard.tables[0]?.mapping.name === 0 && standard.tables[0]?.mapping.studentNo === 1, '1. 应自动映射姓名学号')
  assert(!standard.needsColumnMapping, '1. 高置信无需手动映射')

  const titled = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('学生名单', [
      ['广州市XX中学七年级学生名单'],
      ['2026学年第一学期'],
      ['', '', '', ''],
      ['序号', '学号', '姓名', '性别', '班级'],
      ['1', '01', '张三', '男', '初一1班'],
      ['2', '02', '李四', '女', '初一1班']
    ])
  ])
  assert(titled.tables[0]?.headerRowNumber === 4, '2. 标题后应识别第4行为表头')
  assert(titled.tables[0]?.mapping.studentNo === 1, '2. 有学号时不要用序号')
  assert(titled.suggestedAcademicYear === '2026-2027', '2. 应从标题识别学年')
  assert(!titled.needsColumnMapping, '2. 无需手动映射')

  const aliases = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('花名册', [
      ['编号', '学生姓名', '男女', '行政班', ''],
      ['A01', '张三', '男', '初一1班', ''],
      ['A02', '李四', '女', '初一1班', ''],
      ['A03', '王五', '男', '初一1班', '']
    ])
  ])
  assert(aliases.tables[0]?.mapping.name !== null, '3. 学生姓名应识别为姓名')
  assert(aliases.tables[0]?.mapping.gender !== null, '3. 男女应识别为性别')
  assert(aliases.tables[0]?.mapping.className !== null, '3. 行政班应识别为班级')
  assert(!aliases.needsColumnMapping, '3. 别名表无需手动映射')

  const sheetClass = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('初一2班', [
      ['学号', '姓名', '性别'],
      ['01', '张三', '男'],
      ['02', '李四', '女'],
      ['03', '王五', '男']
    ])
  ])
  assert(sheetClass.tables[0]?.mapping.className === null, '4. 可以没有班级列')
  assert(sheetClass.tables[0]?.classContext?.source === 'sheet', '4. 班级应来自Sheet名')
  const sheetIncoming = buildIncomingFromDetectedWorkbook(sheetClass)
  assert(sheetIncoming.every((item) => item.classRaw.includes('2班')), '4. 行班级应填入Sheet班级')
  assert(!sheetClass.needsColumnMapping, '4. 无需手动列映射')

  const fileClass = detectStudentRosterWorkbook('初一2班学生名单.xlsx', [
    sheet('Sheet1', [
      ['学号', '姓名', '性别'],
      ['01', '张三', '男'],
      ['02', '李四', '女'],
      ['03', '王五', '男']
    ])
  ])
  assert(fileClass.tables[0]?.classContext?.source === 'filename', '5. 无班级列时应使用文件名')
  assert(!fileClass.needsColumnMapping, '5. 无需手动映射')

  const multiClass = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['班级', '学号', '姓名', '性别'],
      ['初一1班', '1', '张三', '男'],
      ['初一1班', '2', '李四', '女'],
      ['初一2班', '1', '王五', '男']
    ])
  ])
  const multiIncoming = buildIncomingFromDetectedWorkbook(multiClass)
  const classSet = new Set(multiIncoming.map((item) => item.classRaw))
  assert(classSet.size === 2, '6. 单Sheet多班应拆出两个班级')
  assert(!multiClass.needsColumnMapping, '6. 无需手动映射')

  const multiSheet = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('初一1班', [
      ['学号', '姓名', '性别'],
      ['01', '张三', '男'],
      ['02', '李四', '女'],
      ['03', '王五', '男']
    ]),
    sheet('初一2班', [
      ['学号', '姓名', '性别'],
      ['01', '赵六', '女'],
      ['02', '钱七', '男'],
      ['03', '孙八', '女']
    ]),
    sheet('初一3班', [
      ['学号', '姓名', '性别'],
      ['01', '周九', '男'],
      ['02', '吴十', '女'],
      ['03', '郑一', '男']
    ])
  ])
  assert(multiSheet.tables.length === 3, '7. 多Sheet应一次识别三个班')
  assert(buildIncomingFromDetectedWorkbook(multiSheet).length === 9, '7. 三个Sheet学生应合并')
  assert(!multiSheet.needsColumnMapping, '7. 无需手动映射')

  const serialAndNo = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['序号', '学号', '姓名', '性别', '班级'],
      ['1', '2026001', '张三', '男', '初一1班'],
      ['2', '2026002', '李四', '女', '初一1班'],
      ['3', '2026003', '王五', '男', '初一1班']
    ])
  ])
  assert(serialAndNo.tables[0]?.mapping.studentNo === 1, '8. 同时有序号和学号时应优先学号')

  const emptyCols = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['', '姓名', '', '学号', '性别', '班级'],
      ['', '张三', '', '01', '男', '初一1班'],
      ['', '李四', '', '02', '女', '初一1班'],
      ['', '王五', '', '03', '男', '初一1班']
    ])
  ])
  assert(emptyCols.tables[0]?.mapping.name !== null && emptyCols.tables[0]?.mapping.studentNo !== null, '9. 空列不应干扰识别')

  const newlineHeader = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['姓\n名', '学号', '性别（男/女）', '所在班级'],
      ['张三', '01', '男', '初一1班'],
      ['李四', '02', '女', '初一1班'],
      ['王五', '03', '男', '初一1班']
    ])
  ])
  assert(newlineHeader.tables[0]?.mapping.name === 0, '10. 表头换行应识别姓名')
  assert(newlineHeader.tables[0]?.mapping.gender === 2, '10. 括号说明应去掉后识别性别')
  assert(newlineHeader.tables[0]?.mapping.className === 3, '10. 所在班级应识别')

  const mf = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['姓名', '学号', '性别', '班级'],
      ['张三', '01', 'M', '初一1班'],
      ['李四', '02', 'F', '初一1班'],
      ['王五', '03', 'M', '初一1班']
    ])
  ])
  const mfIncoming = buildIncomingFromDetectedWorkbook(mf)
  assert(mfIncoming[0].gender === 'male' && mfIncoming[1].gender === 'female', '11. M/F 应转为系统性别')

  const sevenClass = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['姓名', '学号', '性别', '班级'],
      ['张三', '01', '男', '七（1）班'],
      ['李四', '02', '女', '七（1）班'],
      ['王五', '03', '男', '七（1）班']
    ])
  ])
  const sevenIncoming = buildIncomingFromDetectedWorkbook(sevenClass)
  assert(sevenIncoming[0].classRaw.includes('1') && sevenIncoming[0].classRaw.includes('班'), '12. 应保留班级单元格')
  assert(parseClassLabel('七（1）班').parseable && parseClassLabel('七（1）班').grade === '初一', '12. 七（1）班应标准化为初一1班候选')

  const withGuide = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('填写说明', [['本表用于导入'], ['不要把本页当名单']]),
    sheet('成绩分析', [['项目', '平均分'], ['50米', '8.1']]),
    sheet('学生名单', [
      ['姓名', '学号', '性别', '班级'],
      ['张三', '01', '男', '初一1班'],
      ['李四', '02', '女', '初一1班'],
      ['王五', '03', '男', '初一1班']
    ])
  ])
  assert(withGuide.tables.length === 1 && withGuide.tables[0].sheetName === '学生名单', '13. 应跳过说明和成绩分析')
  assert(withGuide.skippedSheets.length >= 2, '13. 说明Sheet应被跳过')

  const dupHeader = detectStudentRosterWorkbook('roster.xlsx', [
    sheet('名单', [
      ['姓名', '学号', '性别', '班级'],
      ['张三', '01', '男', '初一1班'],
      ['姓名', '学号', '性别', '班级'],
      ['李四', '02', '女', '初一1班']
    ])
  ])
  assert(dupHeader.tables[0]?.rowCount === 2, '14. 重复标题行不应当作学生')

  const unknownClass = detectStudentRosterWorkbook('students.xlsx', [
    sheet('Sheet1', [
      ['姓名', '学号', '性别'],
      ...names.map((name, index) => [name, String(index + 1), index % 2 === 0 ? '男' : '女'])
    ])
  ])
  assert(unknownClass.tables[0]?.mapping.name !== null, '15. 字段仍应自动识别')
  assert(!unknownClass.needsColumnMapping, '15. 不确定班级时不应要求全部字段重映射')
  assert(unknownClass.needsClassConfirmation, '15. 只应要求确认班级')

  void names
}

export function runRosterAutoDetectionSelfCheckOrThrow(): string {
  runRosterAutoDetectionSelfCheck()
  return 'roster auto-detection self-check passed'
}
