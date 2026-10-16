import { createClassId } from '../class/validate'
import { APP_VERSION } from '../appVersion'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { COMPANION_DESKTOP_ONLY_MESSAGE, createBrowserAppApi } from './browserAppApi'
import {
  buildCompanionSnapshot,
  companionSnapshotFileName,
  parseCompanionSnapshot,
  serializeCompanionSnapshot
} from './parse'
import { createMemoryCompanionStore } from './store'
import { decryptLiveSyncPayload, encryptLiveSyncPayload } from './liveSyncCrypto'
import { startCompanionLiveServer } from './liveSyncServer'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

export async function runCompanionSelfCheckOrThrow(): Promise<string> {
  const empty = buildCompanionSnapshot({
    appVersion: APP_VERSION,
    classes: [],
    students: [],
    testItems: BUILTIN_TEST_ITEMS,
    peTests: []
  })
  assert(empty.kind === 'gdpe-companion', 'kind 必须固定')
  assert(empty.schemaVersion === 1, 'schemaVersion 必须为 1')
  const roundTrip = parseCompanionSnapshot(JSON.parse(serializeCompanionSnapshot(empty)))
  assert(roundTrip.testItems.length === BUILTIN_TEST_ITEMS.length, '同步包 round-trip 失败')
  assert(companionSnapshotFileName('2026-10-15T12:34:56.000Z').includes('gdpe-companion-'), '文件名前缀')
  const legacy = parseCompanionSnapshot({
    kind: 'gdpe-companion',
    schemaVersion: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    appVersion: '1.0.2',
    classes: [],
    students: [],
    testItems: [],
    peTests: []
  })
  assert(legacy.schedule === undefined && legacy.peSessions === undefined, '旧同步包必须保留课表和课堂为空缺')
  const sealed = await encryptLiveSyncPayload('ABCD-EFGH-JKLM', serializeCompanionSnapshot(empty))
  const opened = await decryptLiveSyncPayload('abcd efgh jklm', sealed.iv, sealed.ciphertext)
  assert(parseCompanionSnapshot(JSON.parse(opened)).classes.length === empty.classes.length, '在线同步加解密失败')
  let current = empty
  const live = await startCompanionLiveServer({
    token: 'ABCD-EFGH-JKLM',
    load: async () => current,
    apply: async (snapshot) => {
      current = snapshot
    }
  })
  try {
    const base = live.status().localUrl
    const put = await fetch(`${base}/sync/snapshot`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-gdpe-token': 'ABCDEFGHJKLM' },
      body: JSON.stringify({ baseRevision: 0, ...sealed })
    })
    assert(put.status === 200, '在线同步写入必须成功')
    const stale = await fetch(`${base}/sync/snapshot`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-gdpe-token': 'ABCDEFGHJKLM' },
      body: JSON.stringify({ baseRevision: 0, ...sealed })
    })
    assert(stale.status === 409, '过期修订必须拒绝')
    const denied = await fetch(`${base}/sync/snapshot`, { headers: { 'x-gdpe-token': 'WRONG-CODE-XXXX' } })
    assert(denied.status === 401, '错误同步码必须拒绝')
  } finally {
    await live.stop()
  }

  let threw = false
  try {
    parseCompanionSnapshot({ kind: 'other' })
  } catch {
    threw = true
  }
  assert(threw, '错误 kind 必须拒绝')

  const store = createMemoryCompanionStore()
  const api = createBrowserAppApi(store)
  const items = await api.testItems.get()
  assert(items.length > 0, '网页宿主必须提供内置测试项目')
  assert((await api.dataIntegrity.startupStatus()) === null, '网页宿主启动自检应为 null')

  const now = '2026-01-01T00:00:00.000Z'
  const expected = await api.classes.get()
  const saved = await api.classes.save(
    [
      {
        id: createClassId(),
        className: '初一1班',
        grade: '初一',
        academicYear: '2026-2027',
        semester: '第一学期',
        studentCount: 0,
        notes: '',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ],
    expected
  )
  assert(saved.length === 1 && saved[0]?.className === '初一1班', 'classes.save 必须写入')

  let desktopRejected = false
  try {
    await api.backup.create()
  } catch (error) {
    desktopRejected =
      error instanceof Error && error.message.includes(COMPANION_DESKTOP_ONLY_MESSAGE.slice(0, 10))
  }
  assert(desktopRejected, '桌面专属 API 必须拒绝')

  const snapshot = await api.companion.getSnapshot()
  assert(snapshot.classes.length === 1, 'getSnapshot 必须包含已保存班级')
  const applied = await api.companion.applySnapshot(
    buildCompanionSnapshot({
      appVersion: APP_VERSION,
      classes: [],
      students: [],
      testItems: BUILTIN_TEST_ITEMS,
      peTests: []
    })
  )
  assert(applied.ok, 'applySnapshot 必须成功')
  assert((await api.classes.get()).length === 0, 'applySnapshot 必须整表替换')

  return 'companion / web host self-check passed'
}
