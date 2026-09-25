# V1.0 RC 发布阻断项修复报告

日期：2026-09-25。分支：`fix/v0290-rc-blockers`。开发版本保持 `0.29.0`。

基线工作区干净，HEAD 为 `abb8bae`，已包含 P0 数据安全修复 `4cb0f4f`、课堂闭环修复 `db7bc15`、体育测试修复 `abb8bae`。本轮未新增体育业务功能，未修改评分核心，未迁移历史数据，未访问真实 userData，未合并、创建 tag 或发布 Release。

1. **备份一致性（RC-01）**：备份从枚举业务文件、校验、读取到写出并验证归档，全程持有既有 persistence write gate 的快照权限。任何并发业务写入不能进入复制中间状态；无法取得权限就明确失败，不报告成功。未完成磁盘事务同样阻止备份。备份目标也不能覆盖业务 JSON、附件或事务日志。

2. **Backup / Save / Import / Restore 协调**：普通 JSON 保存使用 `withWrite`；集合保存、附件写操作使用排他权限；Excel 导入和训练队多文件修改复用 staging + journal + 原子文件事务。Restore 持有排他权限，内部安全备份复用当前 owner，避免再次获取同一锁造成死锁。独立备份允许普通读取，写操作忙时快速返回明确错误。所有权限均由 `finally` 释放；进程退出后内存锁消失，未完成磁盘事务由下次启动恢复。没有新增锁文件或独立大型锁系统。

3. **附件保留（RC-02）**：删除 `loadResources()` 隐含的 `sweepOrphans()`。缺失、空、损坏和不完整索引均不再授权删除磁盘文件。健康检查只报告 `unknown_attachment` / `missing_attachment`，未知附件保持原始字节。用户主动删除单个资源仍有效；删除副本失败时提示保留，不再承诺下次自动清理。

4. **健康检查范围（RC-03）**：单一权威文件清单位于 `src/shared/persistence/businessFiles.ts`，包含 `classes.json`、`students.json`、`schedule.json`、`pe-sessions.json`、`pe-tests.json`、`test-items.json`、`teaching-plans.json`、`resources.json`、`training-teams.json`、`training-members.json`、`training-plans.json`、`training-sessions.json`、`training-items.json`、`training-results.json`、`settings.json`。Backup、Restore 和 integrity audit 共用该清单；业务路径 helper 限制为清单类型，校验器映射要求穷尽全部文件。逐文件提供文件名、错误类型、可解析性、结构异常、隔离状态、写保护状态、恢复来源状态。备份候选只报告“需校验”，不会伪称可恢复。Startup 检查不初始化、不重写、不移动、不删除业务数据；损坏文件原地保留并禁止普通保存覆盖。

5. **首次启动（RC-04）**：创建必要目录和 `.gdpe-initialized.json` 分类标记，区分 new / existing / returning。业务 JSON 由原有 guarded loader 延迟创建；必要默认设置和内置项目可正常加载。课表不再填充示例业务数据，班级、学生、课堂、测试、教学计划和训练队保持合法空状态。

6. **再次启动和部分旧数据**：标记只分类，不作为重置指令；已有文件从不由初始化覆盖。文件首次创建仍使用 `onlyIfMissing` 保护，避免并发初始化覆盖已保存内容。目录存在但没有业务痕迹可判定 new；存在部分业务文件、附件或事务证据则判定 existing。空目录、部分文件、初始化后重启、保存后重启均已回归。

7. **Windows 打包（RC-05）**：新增固定版本 electron-builder `26.15.0` 和 `electron-builder.yml`；提供 `npm run package:win`（x64 unpacked）与 `npm run dist:win`（x64 NSIS）。打包缓存位于项目 `release` 下，解决中文用户目录与不同盘符环境中出现的缓存解压 EXDEV 问题。每用户安装、`asInvoker`、无提权、卸载不删数据、安装后不自动启动。`asar: true`，只收集 `out`、package metadata 和生产依赖，`extraResources` 为空。

8. **应用身份兼容**：历史 `package.json.name` 一直为 `gd-pe-teacher-assistant`，保持不变；此前没有 installer、显式 productName 或 appId。productName 固定为同名，appId 固定为 electron-builder 默认派生值 `com.electron.gd-pe-teacher-assistant`。正常运行继续使用 Electron 的 `%APPDATA%/gd-pe-teacher-assistant`。测试专用环境变量只接受带 sentinel 的隔离目录，正常运行无路径覆盖。没有引入第二生产数据目录，也没有数据搬迁。

9. **产物**：`release/win-unpacked/gd-pe-teacher-assistant.exe`；`release/gd-pe-teacher-assistant-0.29.0-x64-setup.exe`，96,719,277 字节。最终安装包 SHA-256：`E508E0CE3727AE7B27EA970E20EFB848A117E32EB8A663CD77823D93782B49EC`。产物和下载缓存被 Git 忽略，不作为源码推送。

10. **Windows、中文和权限测试**：实际 Windows 11 build `26200`、中文用户名“睿”、包含中文及空格的程序目录与数据目录。实际执行令牌非管理员。真实 NSIS 静默安装、覆盖安装、卸载均完成；脚本先拒绝覆盖机器上的已有同名安装，只操作本次新建临时安装目录。

11. **打包版 Excel**：通过实际 preload/IPC 调用打包后的 SheetJS，写出 XLSX、读取工作表、学生名单预览及事务导入全部通过。既有 Excel 回归还覆盖成绩解析、入库及历史导出往返。

12. **打包版评分标准**：主进程启动内置 catalog 完整性校验通过；实际 Renderer 进入评分标准页面并显示广州标准。历史成绩从旧数据读取，不因启动或升级重算。

13. **打包版备份恢复**：真实 IPC 创建备份，修改学生数据，恢复备份并生成恢复前安全备份，重启后核对一致；附件副本位于隔离 userData 的 `resources/files`。包内检查确认 xlsx、preload、renderer 完整，未含业务根 JSON 或用户附件。

14. **旧数据升级**：模拟旧目录包含班级、学生、课表、历史课堂、体育测试及非空历史评分、教学计划、训练队、设置和附件。打包程序启动、读取及 Backup/Restore 后，原有文件逐字节 hash 一致，历史 71 分快照保留。实际覆盖安装后再次打开前次隔离目录，学生与课堂内容保持；卸载后学生文件 hash 不变。

15. **启动失败可见（RC-06）**：主进程启动链异常、未处理异常/拒绝、preload 失败、Renderer 加载失败及进程退出均接入本地诊断。主进程显示普通用户提示：启动失败、数据未被自动删除、日志位置与恢复建议。React error boundary 提供页面错误提示；HTML 在脚本尚未加载时也有启动与排查说明。用户界面不显示完整 stack。

16. **本地诊断**：`userData/logs/startup.log`；记录时间、事件类别、异常类型、技术 stack 帧及已知 JSON 文件路径，递归记录有限深度的技术 cause。不记录任意错误消息、IPC 业务载荷或对象内容。无上传、遥测或第三方日志服务。真实打包程序注入主进程异常后，验证本地日志和用户提示生成。

17. **原失败 self-check（RC-07）**：`student/ipcSelfcheck.ts` 用正则只识别直接 `ipcMain.handle()`，前一轮已经将 `students:save` 改为 `handleCollectionSave()` 注册，导致误报。修正测试以识别注册适配器，并检查适配器确实调用 `ipcMain.handle(channel, ...)`。没有删除断言或改变业务行为；真实保存及陈旧集合冲突仍由 classroom regression 检查。最终 61/61 组自检通过。

18. **AI 助手**：入口及标题明确标为“AI 助手（暂未开放）”；保留原有后续版本说明，没有接 API 或实现 AI 能力。

19. **代码签名**：未购买、配置或使用证书；Windows `Get-AuthenticodeSignature` 确认为 `NotSigned`。内部受控试用可能遇到 SmartScreen / 未知发布者提示。正式扩大公开分发前安排签名、应用图标及品牌元数据，签名不作为本轮技术阻断。[NSIS 官方配置说明](https://www.electron.build/nsis/)是 per-user 安装与 `deleteAppDataOnUninstall: false` 配置依据。

20. **自动回归**：`npm run check:release` 全部退出码 0：Node TypeScript、Web TypeScript、build、P0/persistence 数据安全 21 组及既有 integrity/import/backup suites、课堂 32 项与 UI 13 项、体育测试 93 项与 UI 10 项、全部 self-check 61 组、本轮 RC regression 15 组。RC 用例覆盖冲突双方先持锁、失败释放、连续备份、附件六种状态、全部业务文件语法/结构损坏、空/部分/重启数据以及训练多文件事务。既有 P0 测试以独立进程异常退出验证 preparing/committing/rollback/committed/cleanup 各阶段恢复。`git diff --check` 通过。

21. **Packaged smoke**：首轮直接 unpacked 程序通过；最终产物再通过真实 NSIS 安装后执行完整 smoke。测试使用真实 main/preload/renderer 与生产 IPC，仅自动选择原生文件对话框；没有替换业务实现。覆盖首次/再次启动、空页面、创建班级及学生、课表、创建保存课堂、体育测试、Excel、标准库、备份修改恢复重启、附件、损坏 JSON、未完成事务和本地诊断。

22. **Upgrade smoke**：模拟旧格式目录逐字节保留通过；NSIS 覆盖安装后读取前次隔离数据通过；卸载保留隔离数据通过。该验证覆盖本项目首次 installer 的同版本替换流程及已有开发版数据兼容，不宣称已覆盖不存在的历史 installer 产品或任意第三方迁移方案。

23. **P0**：本轮发布工程范围内没有已知未解决 P0。损坏/不明事务仍坚持阻止危险写入并保留证据；不会为了使测试通过而清空或猜测用户数据。

24. **安装/升级数据安全 P1**：本轮没有已知未解决问题。未更换用户数据目录，安装目录仅含程序，安装/覆盖/卸载不删除业务数据。所有验证数据均为新建的合成 fixture。

25. **可延后事项**：AI 能力、商业图标和安装品牌美化、明确用户授权的未知附件归属整理、ARM64 及更多 Windows 设备矩阵。扩大公开分发前安排代码签名；它不是本轮 P0/P1 修复的一部分。

26. **Commit**：修复与本报告使用同一提交，message 为 `fix(release): close v1 rc engineering blockers`。最终 commit hash 在交付消息中给出；可用 `git log -1 --format=%H -- docs/v0290-rc-blockers-report.md` 精确定位。

27. **Push**：只推送专项修复分支到 origin 作为备份，不 merge/tag/Release。实际执行结果在交付消息中记录。

28. **工作区**：提交前仅包含本轮发布工程修改、测试和报告。提交后以 `git status --short` 核对，并在交付消息记录最终状态；ignored 的安装包、测试日志及缓存不会进入提交。

**结论：当前代码已具备下一步生成 `1.0.0-rc.1` 并开始小范围受控试用的条件。本轮仍为 `0.29.0`，没有创建正式版本或 Release。**

复验入口：`npm run check:release`、`npm run dist:win`、`npm run check:packaged`、PowerShell `./scripts/installer-smoke.ps1`。机器可读结果及各检查日志保存在本地 `release/rc-*-results.json` 和 `release/check-*.log`；测试脚本自动生成并保护隔离数据根，不能指向真实用户数据。
