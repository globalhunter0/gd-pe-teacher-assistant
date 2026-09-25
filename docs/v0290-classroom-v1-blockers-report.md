# v0.29.0 V1.0课堂业务闭环修复报告

验证日期：2026-09-25。修复分支：`fix/v0290-classroom-v1-blockers`。

本轮从干净工作区及 P0 安全检查点 `4cb0f4fba1f223e611f375872bd41c45befdb024` 开始。执行范围为课堂主链路正确性修复，没有开发显式调课功能。本轮规定的自动验证全部通过；在本轮检查范围内，没有发现尚未解决的 P0。

## 1. 修改文件清单

- `docs/v0290-classroom-v1-blockers-report.md`
- `package.json`
- `scripts/check-classroom-selfchecks.mjs`
- `scripts/check-classroom.mjs`
- `scripts/classroom-regression.ts`
- `scripts/classroom-ui-regression.ts`
- `scripts/ui-hook-harness.ts`
- `src/main/classIpc.ts`
- `src/main/collectionIpc.ts`
- `src/main/peSessionIpc.ts`
- `src/main/peSessionStore.ts`
- `src/main/peTestIpc.ts`
- `src/main/scheduleImport.ts`
- `src/main/scheduleIpc.ts`
- `src/main/studentImport.ts`
- `src/main/studentIpc.ts`
- `src/main/teachingPlanIpc.ts`
- `src/main/testItemStore.ts`
- `src/main/userJsonFile.ts`
- `src/preload/index.d.ts`
- `src/preload/index.ts`
- `src/renderer/src/components/PeSessionEditor.tsx`
- `src/renderer/src/context/ClassContext.tsx`
- `src/renderer/src/context/PeSessionContext.tsx`
- `src/renderer/src/context/PeTestContext.tsx`
- `src/renderer/src/context/ScheduleContext.tsx`
- `src/renderer/src/context/StudentContext.tsx`
- `src/renderer/src/context/TeachingPlanContext.tsx`
- `src/renderer/src/context/TestItemContext.tsx`
- `src/renderer/src/pages/DashboardPage.tsx`
- `src/renderer/src/pages/PeLessonRecordsPage.tsx`
- `src/shared/examBatch/peTestImport/execute.ts`
- `src/shared/peSession/identity.ts`
- `src/shared/peSession/selfcheck.ts`
- `src/shared/peSession/validate.ts`
- `src/shared/peSession/workbenchToday.ts`
- `src/shared/persistence/collectionConflict.ts`
- `src/shared/persistence/jsonFile.ts`
- `src/shared/schedule/classroomEligibility.ts`

## 2. P0-01 的真实路径与修复

原有 Context 通过 `get()` 读取数组，在前端拼接或筛选后调用 `save(items)`；主进程直接保存整个集合。文件原子替换只能防止半写文件，不能识别调用方的陈旧集合。

现在班级、学生、课表、课堂、教学计划、体育测试和测试项目的集合保存都传递 `expected` 读取基线。主进程 `handleCollectionSave` 在既有独占数据访问门内重新加载、比较基线、执行校验并完成保存。比较与提交之间不能插入另一个业务写入。课堂编辑另校验打开编辑器时的原记录，防止 Context 更新后把陈旧编辑草稿当作当前记录。

学生导入、课表导入和成绩导入在既有暂存事务内、实际写入前复核它们规划时的基线。测试项目自动补齐也携带基线，并在同文件写锁内比较后才替换。

## 3. 陈旧集合、首次保存与旧数据兼容

- A、B 读取同一集合，A 修改保存后，B 使用原基线保存被 `DATA_CONFLICT` 拒绝，A 的数据保持不变。
- 缺失读取基线同样拒绝；没有自动合并，也没有自动挑选一方覆盖。
- 比较按对象实际属性值执行，忽略属性插入顺序，避免默认对象与解析后对象在首次保存时误报冲突。
- 首次初始化在同文件写锁内再次检查存在性，已经由另一流程创建或编辑的文件不会被默认集合覆盖。
- 事务中的首次初始化可以读取暂存值，不需要提前写入正式文件。
- 保留原 JSON envelope 和旧数组读取兼容，没有新增 revision 字段或迁移历史数据。
- 独占事务正在进行时，其他业务请求可能收到明确的忙碌错误，需要稍后重试。

## 4. 课堂唯一身份最终规则

业务身份为 `classId + date + period + 类型域`，实现集中于 `classroomIdentityKey`。

- 普通课类型域：常规体育课、大课及有课表关联的课堂。
- 独立补课类型域：`lessonType === 'extra'` 且没有 `scheduleLessonId`。
- 同一类型域、同班、同日、同节次最多一条课堂。
- `sessionId` 是课堂记录的稳定主键。
- `scheduleLessonId`、`teachingPlanId`、`teachingPlanWeekId` 是来源关联，不是课堂身份。
- 不同班级、日期或节次可以存在不同合法课堂，不能只因课表 ID 相同而合并。

已保存课堂的班级、日期、节次、类型、来源关联及关键历史快照不可通过普通编辑重新归属。

## 5. 防重复规则

前端创建入口先按共享身份查找已有课堂，再检查新建所需条件；同步 ref 防止同一入口连续点击重复发起创建。Context 使用主进程 `peSessions:create`。

主进程串行执行“读当前课堂 → 查找身份 → 返回已有课堂或验证后新建”。重复请求返回原课堂及最新集合，前端打开实际持久化返回的记录。普通集合保存仍执行身份唯一性检查，因此防重复不依赖按钮 disabled。

## 6. 课表变化、调课与补课

严格执行本轮确认的方案 1：已保存课堂属于历史事实。原第 2 节课堂保留；课表后来改为第 4 节，第 4 节默认是另一节合法课堂。系统不根据同班、同日或课表变化推断调课关系。

同班同日同节次仅课表 ID 变化，普通课仍匹配原课堂。独立补课可与同节次普通课共存，重复进入该补课复用原记录；补课不能让普通课格子显示已记。显式调课关系留待后续版本。

## 7. 工作台课堂资格

工作台和课表共用 `resolveScheduleClassroomEligibility`：需要有效在用行政班、体育课程类型，并排除特殊活动及带训练队关联的项目。即使一个条目同时带班级 ID 和训练队 ID，也不能进入普通课堂流程。

工作台只统计符合资格的普通课堂记录状态；训练队/其他活动显示相应说明，不显示“开始课堂”。课表、班级、课堂记录尚未加载完成时不展示基于空数组得出的课堂状态。训练队业务模块及其规则未修改。

## 8. 删除班级保护

保留既有班级软删除及历史引用保护。新建选择器使用当前班级列表；前端创建与主进程保存再次拒绝已删除或不存在的班级。新建时还检查班级名称和年级快照是否已过期。

旧课堂继续使用冻结快照，并可由历史记录入口打开；不级联删除课堂、学生历史或体育测试。

## 9. 历史名单真实性

创建时冻结当时 active 学生的 ID、姓名、学号。主进程用最新学生档案核对新课堂名单，拒绝未加载、遗漏、已转出、已删除或姓名发生变化的陈旧名单。

打开历史课堂不会同步今天的班级名单。转班、转出、软删除、改名、后续转入均不改写旧课堂。保存时禁止移除原学生记录或改写原身份/姓名/学号快照。

“补充学生”保留为明确点击、人工确认、再保存的操作；只追加当前仍在读的学生。保存时再核对追加对象，避免确认后档案变化导致错误补入。已完成课堂需先重新打开。

## 10. completed 编辑规则

沿用实际状态机：`in_progress` / `completed`。旧数据缺少 status 时按进行中解释，读取不强制添加状态字段。

完成后的课堂内容只读；需要编辑时，先持久化“重新打开”，成功后再修改并保存。界面禁用主题、小结、考勤、参与状态、标签、备注及补充名单，并在事件处理层再次保护。主进程拒绝直接修改 completed 内容。课堂测评继续使用自身状态机，不随课堂完成状态改变成绩。

## 11. 保存与完成失败反馈

“保存”“完成本节”“重新打开”均等待主进程成功后更新成功提示和状态。完成/重开失败保留原状态；保存失败保留当前草稿、显示失败原因，不显示保存成功。每次发起保存清除旧成功提示；同步保存锁防止连续点击重复请求。

批量考勤、备注与表现标签先修改草稿，只有显式保存真正完成后才显示已保存。

## 12. 开始课堂的数据时序

创建页等待课堂、班级、学生、课表和教学计划全部就绪；任一读取失败阻止新建并显示错误。数据就绪后仅执行一次预填创建。已有课堂优先复用原快照，当前班级已经没有在读学生也不妨碍打开历史记录。

主进程同时验证当前班级、课表资格、名单及新课堂使用的计划/周次关联，作为前端时序之外的第二层保护。

## 13. 删除课堂与关联小测、成绩

采用保守处理：只要任何体育测试仍引用该课堂的 `peSessionId`，就返回 `CLASSROOM_HAS_TESTS`，拒绝删除课堂。课堂、测试、测试记录的 `testSessionId`、已录成绩及其关联全部保留。

没有关联小测的课堂可以删除，不修改其他测试集合。新建测评若引用不存在的课堂会被拒绝。本轮不实现跨模块删除后解关联，也不自动猜测修复既存悬空链接。

## 14. 新增自动测试清单

`npm run check:classroom`：32 项业务/持久化检查，13 项界面状态检查，共 45 项，全部通过。

业务检查覆盖：

1. 事务中首次初始化、暂存读取和最终提交。
2. 并发首次初始化与随后陈旧写入拒绝。
3. 首次加载、空集合和缺失基线。
4. 教学计划首次创建。
5. 班级、学生、课表、教学计划、测试项目真实 A/B 陈旧保存冲突（5 项）。
6. 正常课堂创建、重新读取；旧空集合不能覆盖新课堂。
7. 课堂 A 修改后 B 的旧记录保存拒绝。
8. 连续原子创建请求返回同一记录。
9. 重复集合创建与并发保存不产生第二课堂。
10. 已有课堂匹配、课表 ID 变化及不同班/节次区分。
11. 普通课、训练队、其他活动、删除班级资格。
12. 学生转班、转出、删除、改名后历史不变（4 项）。
13. 后转入学生不加入旧课；陈旧名单新建拒绝。
14. 删除班级保留旧课堂、拒绝新建。
15. 完成、重开、工作台状态及 completed 编辑拒绝。
16. 保存和完成磁盘失败，持久化状态不变（2 项）。
17. 有已录成绩的小测阻止课堂删除，成绩和关联保留。
18. 体育测试 A 修改成绩后 B 陈旧保存拒绝。
19. 跨节次修改课表，原课堂保留、新课堂独立创建。
20. 独立补课与普通课共存，补课复用、工作台正确匹配。
21. 不同班同节次、同班不同节次实际创建。
22. 主进程拒绝训练队/其他活动新建普通课堂。
23. 旧数组及缺少 status 数据加载、首次保存、再打开。
24. 教学计划/周次引用、完成统计、无关联课堂删除。

界面检查覆盖：班级、学生、课表、教学计划、课堂五种慢加载；加载失败；名单已空时打开历史课堂；保存/完成的成功与失败及重复点击；completed 控件和重开失败；批量考勤、备注、标签草稿到持久化。

## 15. 验证实际结果与旧 self-check 冲突

`npm run check:classroom-selfchecks` 的六个专项全部通过：

- 工作台课堂业务 self-check。
- v0.27.0 P0-2 课堂参与状态 self-check。
- v0.27.0 P0-3 课堂完成状态 self-check。
- v0.27.0 P0-1 课堂小测 self-check。
- v0.29.0 P0-3 启动健康与安全恢复 self-check，包含前序数据完整性和导入事务检查。
- v0.28.0 P0-3 教学计划执行统计 self-check。

旧工作台测试的两处预期被更新：不再要求同一课表 ID 跨班级/节次复用；不再要求独立补课占用普通课身份。其余历史兼容、工作台状态及名单检查保留。新测试通过真实持久化验证跨节次课表修改不改变原课堂。

`npm run check:data-safety` 通过：21 组 P0 数据安全检查，以及既有完整性、导入、备份恢复测试。覆盖临时写入失败、fsync/替换失败、损坏文件保护、多文件事务回滚和独立进程崩溃恢复。

`git diff --check` 通过；逐项 diff review 完成。评分公式、Excel 评分标准、训练队业务规则、备份恢复服务、年级教学计划组织规则和 CSS 未修改。对 JSON 持久化的修改限定为条件写入、首次初始化竞争保护及暂存读取，保留原有原子替换和恢复机制。

所有数据测试使用临时目录或模拟数据。Electron 的 userData 路径在业务回归中被替换为新建临时目录，没有访问真实 userData。界面测试执行实际组件处理函数和 effect，使用确定性的 hook 适配器；这属于状态逻辑验证，不等同于启动 Electron 后的 DOM/视觉验收。

## 16. Build 结果

`npm run build` 成功，主进程、preload、renderer 三部分均构建通过，退出码 0。

## 17. TypeScript 结果

- `npx tsc --noEmit -p tsconfig.node.json`：通过，退出码 0。
- `npx tsc --noEmit -p tsconfig.web.json`：通过，退出码 0。

## 18. P0 状态

在本轮明确的课堂业务闭环修复范围和上述自动验证内，没有已知未解决 P0。该结论不代表尚未开展的体育测试评分专项已经审计完成。

## 19. 剩余 P1

有关联小测的课堂尚不支持“删除课堂但独立保留完整溯源”的操作，本轮通过拒绝删除保证安全。既存悬空关联不自动修补；若完整性审计发现此类历史问题，应保留证据并单独处理。没有发现需要继续阻断本轮提交的 P1 数据丢失问题。

## 20. 可延期 P2

冲突后的便捷重新加载/草稿对照、更明确的补充历史名单说明、显式调课关系及独立调课操作可以留到后续版本。本轮不增加自动合并、调课推断或 UI 美化。

## 21. 提交信息

提交消息：`fix(classroom): close v1 teaching workflow blockers`。

本报告随修复一并提交。实际提交哈希在最终交付消息中提供，避免文档写入自身提交哈希造成循环变更。没有 push。

## 22. 工作区状态

最终工作区状态在提交后再次执行 `git status --short` 核实，并在交付消息中报告；测试临时目录由各 runner 清理，构建产物遵循现有忽略规则。

## 23. 下一阶段建议

建议进入“体育测试与评分闭环审计”。课堂身份、历史名单、持久化状态和关联小测保留规则已具备作为下一阶段审计基础的条件；下一阶段应单独验证成绩录入、完成状态、评分标准及导出一致性。
