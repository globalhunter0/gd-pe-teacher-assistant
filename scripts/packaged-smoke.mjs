import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, mkdir, writeFile, readFile, readdir, cp } from 'node:fs/promises'
import { tmpdir, release, userInfo } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { runRcUiSmoke } from './rc-ui-smoke.mjs'

// Real packaged executable + real preload/IPC. Only native dialog choices are automated.
// No app code is replaced, and all data resides below a new sentinel-protected directory.
const root = await mkdtemp(join(tmpdir(), 'gdpe-rc-smoke-中文 空格-'))
const expectedVersion = process.env.GDPE_SMOKE_VERSION ?? JSON.parse(await readFile('package.json', 'utf8')).version
let smokeUsername = process.env.USERNAME ?? 'unknown'
try { smokeUsername = userInfo().username } catch { /* Restricted Windows sessions may not expose account details. */ }
const report = { root, expectedVersion, os: release(), username: smokeUsername, checks: [], startedAt: new Date().toISOString() }
const pass = name => { report.checks.push(name); console.log(`PASS packaged: ${name}`) }
const delay = ms => new Promise(r => setTimeout(r, ms))
const fixtureFile = join(root, 'fixtures.mjs')
await build({ entryPoints: ['scripts/rc-smoke-fixtures.ts'], outfile: fixtureFile, bundle: true, format: 'esm', platform: 'node', alias: { '@shared': resolve('src/shared') } })
const fixture = await import(pathToFileURL(fixtureFile).href)
const executable = process.env.GDPE_SMOKE_EXE ? resolve(process.env.GDPE_SMOKE_EXE) : join(root, '中文 程序目录', 'gd-pe-teacher-assistant.exe')
if (!process.env.GDPE_SMOKE_EXE) await cp(resolve('release/win-unpacked'), join(root, '中文 程序目录'), { recursive: true })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function freePort() { const s = createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise(r => s.close(r)); return p }
async function endpoint(port) {
  for (let i = 0; i < 150; i++) {
    try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const t = targets.find(t => t.webSocketDebuggerUrl && t.type !== 'other'); if (t) return t.webSocketDebuggerUrl } catch {}
    await delay(200)
  }
  throw new Error(`No debug endpoint ${port}`)
}
async function connect(url) {
  const socket = new WebSocket(url); await new Promise((r, j) => { socket.onopen = r; socket.onerror = j })
  let next = 0; const pending = new Map()
  socket.onmessage = event => { const data = JSON.parse(event.data); const item = pending.get(data.id); if (item) { pending.delete(data.id); clearTimeout(item.timer); data.error ? item.reject(new Error(JSON.stringify(data.error))) : item.resolve(data.result) } }
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++next; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout ${method}`)) }, 30000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })) })
  return { socket, send, eval: async expression => { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value } }
}
async function launch(dataRoot) {
  await mkdir(dataRoot, { recursive: true }); await writeFile(join(dataRoot, '.rc-test-root'), 'isolated-rc-test')
  await mkdir(join(dataRoot, 'chromium'), { recursive: true })
  const mainPort = await freePort(), pagePort = await freePort()
  const child = spawn(executable, [`--inspect=127.0.0.1:${mainPort}`, `--remote-debugging-port=${pagePort}`], { windowsHide: true, env: { ...process.env, GDPE_RC_TEST_ROOT: dataRoot, ELECTRON_RENDERER_URL: '' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; child.stdout.on('data', b => { output += b }); child.stderr.on('data', b => { output += b })
  let main, page
  try {
    main = await connect(await endpoint(mainPort)); page = await connect(await endpoint(pagePort))
    await main.eval(`(() => { const e = process.getBuiltinModule('module').createRequire(process.resourcesPath + '/app.asar/package.json')('electron'); globalThis.__rcElectron = e; e.dialog.showErrorBox = (title, text) => { globalThis.__rcError = {title,text} }; return true })()`)
    for (let i = 0; i < 100; i++) { if (await page.eval(`!!window.electronAPI && !!document.body?.innerText.includes('工作台')`)) break; await delay(100) }
    assert(await page.eval(`!!window.electronAPI`), output)
    const identity = await main.eval(`({name:__rcElectron.app.getName(), version:__rcElectron.app.getVersion(), data:__rcElectron.app.getPath('userData'), packaged:__rcElectron.app.isPackaged})`)
    assert.equal(identity.name, 'gd-pe-teacher-assistant'); assert.equal(identity.data, dataRoot); assert(identity.packaged)
    assert.equal(identity.version, expectedVersion)
    assert(await page.eval(`document.body.innerText.includes(${JSON.stringify('v' + expectedVersion)})`), 'visible application version')
    report.electronVersion = identity.version
    const api = (name, ...args) => page.eval(`window.electronAPI.${name}(...${JSON.stringify(args)})`)
    const dialog = async (kind, path) => main.eval(`__rcElectron.dialog.${kind === 'open' ? 'showOpenDialog' : 'showSaveDialog'} = async () => (${JSON.stringify(kind === 'open' ? { canceled: false, filePaths: [path] } : { canceled: false, filePath: path })}); true`)
    return { main, page, api, dialog, output: () => output, stop: async () => {
      page.socket.close(); await main.eval('setTimeout(() => __rcElectron.app.quit(), 100); true'); main.socket.close()
      await Promise.race([new Promise(r => child.once('exit', r)), delay(10000).then(() => { if (child.exitCode === null) child.kill() })])
      await writeFile(join(dataRoot, 'smoke-process.log'), output)
    } }
  } catch (error) { main?.socket.close(); page?.socket.close(); child.kill(); throw new Error(`${error.stack}\n${output}`) }
}
let running
try {
  if (process.env.GDPE_RC_REUSE_ROOT) {
    const previous = resolve(process.env.GDPE_RC_REUSE_ROOT)
    assert(previous.includes('gdpe-rc-smoke-')); assert.equal(await readFile(join(previous, '.rc-test-root'), 'utf8'), 'isolated-rc-test')
    const bytes = await readFile(join(previous, 'students.json'))
    running = await launch(previous)
    assert.equal((await running.api('students.get')).length, 2)
    assert.equal((await running.api('peSessions.get')).find(session => session.id === fixture.session.id)?.notes, '打包课堂保存')
    assert.deepEqual(await readFile(join(previous, 'students.json')), bytes)
    await running.stop(); running = undefined
    pass('NSIS 覆盖安装后读取前次隔离数据，未重置或迁移')
  }
  const fresh = join(root, '全新 用户'); running = await launch(fresh)
  for (const name of ['classes', 'students', 'schedule', 'peSessions', 'peTests', 'teachingPlans', 'trainingTeams', 'resources']) assert.deepEqual(await running.api(`${name}.get`), [])
  assert.equal((await running.api('dataIntegrity.startupStatus')).status, 'healthy')
  const updateStatus = await running.api('appUpdate.getStatus')
  assert.equal(updateStatus.supported, false)
  assert.equal(updateStatus.installKind, 'unsupported')
  assert.equal(updateStatus.state, 'idle')
  pass('首次启动空状态、应用身份与隔离 userData')
  pass('解包烟测不启用自动更新、不访问 GitHub')
  for (const label of ['我的课表', '班级与学生', '课堂记录', '体育测试', '训练队', '教学计划', '资料中心', 'AI 助手（暂未开放）', '备份与恢复']) {
    const clicked = await running.page.eval(`(() => {const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}); if(!b)return false;b.click();return true})()`)
    assert(clicked, `navigation missing: ${label}`); await delay(150)
    assert(!(await running.page.eval(`document.body.innerText.includes('启动失败')`)))
    if (label === '备份与恢复') {
      let updateCopy = false
      for (let i = 0; i < 20; i++) {
        updateCopy = await running.page.eval(`document.body.innerText.includes('检查更新') && document.body.innerText.includes('当前环境不支持应用内更新')`)
        if (updateCopy) break
        await delay(100)
      }
      assert(updateCopy, 'settings must show the unsupported in-app update state')
    }
    if (label === '我的课表' && expectedVersion !== '0.29.0') {
      assert(!(await running.page.eval(`document.body.innerText.includes('恢复默认课表')`)), '示例课表恢复入口必须移除')
      assert(!(await running.page.eval(`document.body.innerText.includes('团队1')`)), '空课表不得显示旧示例团队')
    }
  }
  pass('空数据页面与 AI 暂未开放标识')
  await running.api('classes.save', [fixture.klass], [])
  await running.api('students.save', [fixture.pupil], [])
  await running.api('schedule.save', [fixture.lesson], [])
  const created = await running.api('peSessions.create', fixture.session)
  await running.api('peSessions.save', created.sessions.map(s => ({ ...s, notes: '打包课堂保存' })), created.sessions)
  await running.api('peTests.save', [fixture.test], [])
  assert.equal((await running.api('peTests.get'))[0].records[0].rawValue, 8.1)
  pass('真实 IPC 创建班级、学生、课表、课堂保存、体育测试')
  // Use the packaged SheetJS dependency to write an actual workbook, then import through IPC.
  const workbook = join(root, '学生 名单.xlsx'); await running.dialog('save', workbook)
  assert.equal((await running.api('examBatch.saveWorkbook', { defaultFileName: '学生 名单.xlsx', sheets: [{ name: '学生名单', rows: [['年级', '班级', '学号', '姓名', '性别'], ['初一', '1班', '01', '测试学生', '男'], ['初一', '1班', '02', '导入学生', '女']] }] })).canceled, false)
  assert((await readFile(workbook)).length > 1000)
  await running.dialog('open', workbook); const picked = await running.api('students.importPick'); assert(!picked.canceled)
  const sheetName = picked.sheets[0]; const context = { academicYear: '2026-2027', semester: '第一学期' }
  const preview = await running.api('students.importPreview', picked.sessionId, sheetName, null, context)
  assert(preview.canCommit, JSON.stringify(preview))
  await running.api('students.importCommit', picked.sessionId, sheetName, null, context)
  assert.equal((await running.api('students.get')).length, 2)
  await running.dialog('open', workbook); const exam = await running.api('examBatch.pick'); const loaded = await running.api('examBatch.loadSheet', exam.sessionId, exam.sheets[0]); assert(loaded)
  pass('打包版 Excel 写出、学生预览与事务导入、成绩工作表读取')
  await runRcUiSmoke(running, root, fixture, pass)
  const source = join(root, '教学 附件.txt'); await writeFile(source, 'RC 附件内容'); await running.dialog('open', source)
  assert(!(await running.api('resources.selectFile')).canceled)
  const resources = await running.api('resources.importFile', { title: 'RC附件', category: '其他', tags: [], description: '', notes: '' })
  assert.equal(await readFile(join(fresh, 'resources/files', resources[0].storedFileName), 'utf8'), 'RC 附件内容')
  pass('附件导入与 userData 内副本')
  const snapshot = {}
  for (const name of (await readdir(fresh)).filter(name => name.endsWith('.json'))) snapshot[name] = sha(await readFile(join(fresh, name)))
  const archive = join(root, '一致 快照.gdpebak'); await running.dialog('save', archive); assert(!(await running.api('backup.create')).canceled)
  const manifest = JSON.parse(fixture.parseZip(await readFile(archive)).find(entry => entry.name === 'manifest.json').data.toString())
  assert.equal(manifest.appVersion, expectedVersion)
  report.backupAppVersion = manifest.appVersion
  const students = await running.api('students.get'); await running.api('students.save', students.map(s => ({ ...s, notes: '备份后修改' })), students)
  await running.dialog('open', archive); assert(!(await running.api('backup.restore')).canceled)
  assert.deepEqual(await running.api('students.get'), students)
  pass('打包版创建备份、修改、恢复与安全备份')
  // Visit the actual standards UI: catalog assertion already ran in packaged main startup.
  await running.page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='体育测试');b.click()})()`); await delay(150)
  const standards = await running.page.eval(`(() => {const b=[...document.querySelectorAll('button')].find(b=>/评分标准/.test(b.textContent));if(!b)return false;b.click();return true})()`)
  assert(standards); await delay(200); assert(await running.page.eval(`document.body.innerText.includes('广州')`))
  pass('内置评分标准在打包主进程校验并在 Renderer 加载')
  await running.page.send('Page.captureScreenshot', { format: 'png' }).then(r => writeFile(join(root, 'packaged-standards.png'), Buffer.from(r.data, 'base64')))
  await running.stop(); running = await launch(fresh)
  assert.deepEqual(await running.api('students.get'), students); assert.equal((await running.api('peSessions.get')).find(session => session.id === fixture.session.id)?.notes, '打包课堂保存'); assert.equal((await running.api('resources.get')).length, 1)
  for (const [name, hash] of Object.entries(snapshot)) assert.equal(sha(await readFile(join(fresh, name))), hash, `restore/restart changed ${name}`)
  assert.equal(await readFile(join(fresh, 'resources/files', resources[0].storedFileName), 'utf8'), 'RC 附件内容')
  pass('第二次启动与恢复后重启数据一致')
  await running.stop(); running = undefined
  const old = join(root, '旧版 数据'); await mkdir(join(old, 'resources/files'), { recursive: true })
  const before = {}
  for (const [name, value] of Object.entries(fixture.legacy)) { const bytes = Buffer.from(JSON.stringify(value)); await writeFile(join(old, name), bytes); before[name] = sha(bytes) }
  await writeFile(join(old, 'resources/files', fixture.legacy['resources.json'][0].storedFileName), '历史附件原始字节')
  running = await launch(old)
  for (const name of Object.keys(before)) assert.equal(sha(await readFile(join(old, name))), before[name], `upgrade modified ${name}`)
  assert.equal((await running.api('classes.get'))[0].id, fixture.klass.id)
  assert.equal((await running.api('students.get'))[0].classId, fixture.klass.id)
  assert.equal((await running.api('schedule.get'))[0].classId, fixture.klass.id)
  assert.equal((await running.api('peSessions.get'))[0].classId, fixture.klass.id)
  assert.equal((await running.api('peTests.get'))[0].records[0].examScore, 71)
  assert.equal((await running.api('teachingPlans.get'))[0].name, fixture.plan.name)
  assert.equal((await running.api('trainingTeams.get'))[0].name, fixture.team.name)
  assert.equal((await running.api('trainingMembers.get'))[0].studentId, fixture.pupil.id)
  assert.equal((await running.api('trainingSessions.get'))[0].planId, fixture.trainingPlan.id)
  assert.equal((await running.api('trainingResults.get'))[0].rawValue, 245)
  assert.equal((await running.api('userPreferences.get')).teacherDisplayName, '旧版老师')
  assert.equal(await readFile(join(old, 'resources/files', fixture.legacy['resources.json'][0].storedFileName), 'utf8'), '历史附件原始字节')
  const upgradeBackup = join(root, '旧版 备份.gdpebak'); await running.dialog('save', upgradeBackup); await running.api('backup.create'); await running.dialog('open', upgradeBackup); await running.api('backup.restore')
  for (const name of Object.keys(before)) assert.equal(sha(await readFile(join(old, name))), before[name], `restore modified ${name}`)
  pass('升级：班级、学生、课表、历史课堂、历史评分、教学计划、训练队、设置、附件逐字节保留；备份恢复可用')
  await running.stop(); running = undefined
  const broken = join(root, '损坏 JSON'); await mkdir(broken); await writeFile(join(broken, 'settings.json'), '{broken')
  running = await launch(broken)
  const health = await running.api('dataIntegrity.startupStatus'); const problem = health.issues.find(i => i.entityId === 'settings.json')
  assert(problem?.details?.writeBlocked); assert.equal(await readFile(join(broken, 'settings.json'), 'utf8'), '{broken')
  await assert.rejects(running.api('userPreferences.save', { teacherDisplayName: '不能覆盖' }))
  pass('打包启动检测损坏 JSON 并阻止覆盖')
  await running.stop(); running = undefined
  const recovering = join(root, '未完成 事务'); const tx = join(recovering, '.data-transactions', 'tx-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'); await mkdir(tx, { recursive: true })
  const original = Buffer.from(JSON.stringify([fixture.klass])), newer = Buffer.from('[]')
  await writeFile(join(recovering, 'classes.json'), newer); await writeFile(join(tx, '0.old'), original); await writeFile(join(tx, '0.new'), newer)
  await writeFile(join(tx, 'manifest.json'), JSON.stringify({ version: 1, phase: 'committing', entries: [{ path: 'classes.json', oldHash: sha(original), newHash: sha(newer) }] }))
  running = await launch(recovering); assert.equal((await running.api('classes.get'))[0].id, fixture.klass.id); assert.deepEqual(await readFile(join(recovering, 'classes.json')), original)
  assert.deepEqual(await readdir(join(recovering, '.data-transactions')), [])
  pass('打包版启动恢复未完成事务')
  await running.main.eval(`setTimeout(() => { throw new TypeError('simulated local failure without business payload') }, 0); true`)
  await delay(200)
  const visible = await running.main.eval('globalThis.__rcError')
  assert(visible.text.includes('数据未被自动删除')); assert(visible.text.includes('logs')); assert(!visible.text.includes('TypeError'))
  const diagnostic = await readFile(join(recovering, 'logs/startup.log'), 'utf8'); assert(diagnostic.includes('uncaughtException')); assert(diagnostic.includes('TypeError'))
  if (expectedVersion !== '0.29.0') assert(diagnostic.includes(`appVersion=${expectedVersion}`))
  pass('主进程严重异常：本地技术日志与普通用户可见提示，无业务载荷')
  await running.stop(); running = undefined
  report.passed = true
} catch (error) { report.passed = false; report.error = String(error.stack); console.error(error); process.exitCode = 1 }
finally {
  if (running) await running.stop().catch(() => {})
  report.finishedAt = new Date().toISOString(); await mkdir('release', { recursive: true }); await writeFile(process.env.GDPE_SMOKE_REPORT ?? 'release/rc-smoke-results.json', JSON.stringify(report, null, 2)); console.log(`Smoke artifacts: ${root}`)
}
