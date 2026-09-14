import { findDuplicatePeTests } from '../../examBatch/peTestImport/planImport'
import type { ClassRecord } from '../../class/types'
import type { StudentRecord } from '../../student/types'
import { findTeacherVisibleDuplicates, parseTeacherTestSelection } from '../groupedItems'
import type { PETestSession, TestItem } from '../types'

export function activeStudentsOfClass(
  students: ReadonlyArray<StudentRecord>,
  classId: string
): StudentRecord[] {
  return students
    .filter((item) => item.classId === classId && item.status === 'active')
    .sort(
      (a, b) =>
        a.studentNo.localeCompare(b.studentNo, 'zh-CN', { numeric: true }) || a.name.localeCompare(b.name, 'zh-CN')
    )
}

export function findExistingPeTestsForQuickEntry(
  sessions: ReadonlyArray<PETestSession>,
  classId: string,
  date: string,
  testItemId: string,
  items?: ReadonlyArray<TestItem>
): PETestSession[] {
  if (items) {
    const selection = parseTeacherTestSelection(testItemId, items)
    if (selection) {
      return findTeacherVisibleDuplicates(sessions, classId, date, selection)
    }
  }
  return findDuplicatePeTests(sessions, classId, date, testItemId)
}

export function resolveQuickEntryCatalogItem(
  items: ReadonlyArray<TestItem>,
  testItemId: string
): TestItem | undefined {
  return items.find((item) => item.id === testItemId)
}

export function formatQuickEntryClassLabel(record: ClassRecord): string {
  return `${record.grade} ${record.className}`
}
