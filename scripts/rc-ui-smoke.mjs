import assert from 'node:assert/strict'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

// Exercise the shipped renderer, preload and IPC; no replacement React or scoring code.
export async function runRcUiSmoke(app, root, fixture, pass) {
  const pause = () => new Promise(resolve => setTimeout(resolve, 150))
  async function wait(expression) {
    for (let i = 0; i < 100; i++) { if (await app.page.eval(expression)) return; await pause() }
    throw new Error(`UI wait failed: ${expression}\n${await app.page.eval('document.body.innerText')}`)
  }
  async function click(label) {
    const expression = `(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)} && !b.disabled); if(!b)return false;b.click();return true })()`
    await wait(expression); await pause()
  }
  async function set(selector, value) {
    assert(await app.page.eval(`(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true})()`), selector)
    await pause()
  }
  async function selectOption(text) {
    const found = await app.page.eval(`(() => {for(const s of document.querySelectorAll('select')){const o=[...s.options].find(o=>o.textContent.includes(${JSON.stringify(text)}));if(o){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));return true}}return false})()`)
    assert(found, `option ${text}`); await pause()
  }
  async function reload() {
    await app.page.send('Page.reload')
    await wait(`!!document.querySelector('button') && document.body.innerText.includes('工作台')`)
    await pause()
  }
  const weekday = new Date().getDay()
  assert(weekday >= 1 && weekday <= 5, 'Run classroom workbench smoke on a teaching weekday')
  const schedulePath = join(root, 'RC课表.xlsx')
  await app.dialog('save', schedulePath)
  await app.api('examBatch.saveWorkbook', { defaultFileName: 'RC课表.xlsx', sheets: [{ name: '课表', rows: [
    ['星期', '节次', '开始时间', '结束时间', '课程', '类型'],
    ['星期五', '第1节', '08:00', '08:40', '初一1班', '体育与健康'],
    [`星期${'日一二三四五六'[weekday]}`, '第2节', '08:50', '09:30', '初一1班', '体育与健康']
  ] }] })
  await app.dialog('open', schedulePath)
  const picked = await app.api('schedule.importPick')
  const resolutions = { slotChoices: {}, clearLinks: {}, acknowledgeRemoves: true }
  const preview = await app.api('schedule.importPreview', picked.sessionId, null, resolutions)
  assert(preview.canCommit, JSON.stringify(preview))
  await app.api('schedule.importCommit', picked.sessionId, null, resolutions)
  const schedule = await app.api('schedule.get')
  await app.api('schedule.save', schedule.map(item => ({ ...item, classId: fixture.klass.id })), schedule)
  pass('RC Excel 课表预览、事务导入与班级绑定')
  await reload(); await click('工作台'); await click('开始课堂')
  await wait(`!!document.querySelector('.attendance-buttons')`)
  assert(await app.page.eval(`(() => {const b=[...document.querySelectorAll('.attendance-buttons button')].find(b=>b.textContent==='缺勤');b.click();return true})()`))
  await set('.row-note', 'RC界面考勤备注')
  await click('添加标签')
  await app.page.eval(`document.querySelector('.tag-option input').click()`)
  await click('保存')
  await wait(`document.body.innerText.includes('课堂记录已保存')`)
  const sessions = await app.api('peSessions.get')
  const recorded = sessions.find(s => s.period === 2)
  assert(recorded); assert.equal(recorded.records[0].attendanceStatus, 'absent')
  assert.equal(recorded.records[0].note, 'RC界面考勤备注'); assert.equal(recorded.records[0].performanceTags.length, 1)
  await click('工作台'); await wait(`document.querySelectorAll('.badge-recorded').length === 2 && document.body.innerText.includes('继续记录')`)
  pass('RC 真实界面开始课堂、考勤、标签、备注、保存，工作台进入已记录状态（界面文案：记录中）')

  await click('体育测试'); await click('快速录入')
  await selectOption('800'); await selectOption('国家')
  await click('开始录入')
  await wait(`!!document.querySelector('input[placeholder="342 或 3:42"]')`)
  for (const input of ['342', '4:05']) {
    await set('input[placeholder="342 或 3:42"]', input)
    await app.page.eval(`document.querySelector('input[placeholder="342 或 3:42"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}))`)
    await pause(); await pause()
  }
  const tests = await app.api('peTests.get')
  const endurance = tests.find(s => s.testGroupId && s.records.length === 2)
  assert(endurance, JSON.stringify(tests))
  assert.deepEqual(endurance.records.map(r => r.rawValue), [222, 245])
  assert(endurance.records.every(r => typeof r.examScore === 'number'))
  assert(endurance.records.some(r => r.resolvedTestItemId.endsWith('run-1000m')))
  assert(endurance.records.some(r => r.resolvedTestItemId.endsWith('run-800m')))
  pass('RC 800m / 1000m 男女分项快速录入、分秒解析与国家体测自动评分')
  await click('返回测试记录'); await click('导入成绩'); await selectOption('国家体测（初中）')
  const scorePath = join(root, 'RC体育成绩.xlsx')
  await app.dialog('save', scorePath)
  await app.api('examBatch.saveWorkbook', { defaultFileName: 'RC体育成绩.xlsx', sheets: [{ name: '成绩', rows: [
    ['学号', '姓名', '性别', '50米', '身高(cm)', '体重(kg)'],
    ['01', '测试学生', '男', 8.1, 170, 60], ['02', '导入学生', '女', 8.8, 160, 50]
  ] }] })
  await app.dialog('open', scorePath); await click('选择 Excel')
  await wait(`!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='自动评分')`)
  await click('自动评分'); await wait(`document.body.innerText.includes('导出评分结果')`)
  assert(await app.page.eval(`document.body.innerText.includes('BMI')`))
  const exportPath = join(root, 'RC评分结果.xlsx'); await app.dialog('save', exportPath); await click('导出评分结果')
  for(let i=0;i<100;i++){try {if((await readFile(exportPath)).length>1000)break}catch{}await pause()}
  assert((await readFile(exportPath)).length > 1000)
  await click('预览并保存')
  await set('[role="dialog"] input[type="date"]', '2026-09-24')
  await click('确认导入'); await wait(`document.body.innerText.includes('导入完成')`)
  const imported = (await app.api('peTests.get')).filter(s => s.date === '2026-09-24')
  assert(imported.length >= 4, JSON.stringify(imported))
  const bmi = imported.find(s => s.testItemId.endsWith('-bmi'))
  assert(bmi); assert.deepEqual(bmi.records.map(r => r.rawValue), [20.8, 19.5])
  assert(bmi.records.every(r => typeof r.examScore === 'number'))
  pass('RC 真实 Excel 体育成绩导入、初中国家体测、BMI 推导评分、入库和 Excel 导出')
  await app.api('trainingTeams.save', [fixture.team])
  await app.api('teachingPlans.save', [fixture.plan], [])
  assert.equal((await app.api('trainingTeams.get'))[0].id, fixture.team.id)
  pass('RC 训练队与教学计划创建读取')
  await reload()
}
