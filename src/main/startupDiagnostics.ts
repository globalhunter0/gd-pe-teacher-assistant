import { app, dialog, ipcMain } from 'electron'
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

let shown = false
export function diagnosticPath(): string { return join(app.getPath('userData'), 'logs', 'startup.log') }

export async function recordDiagnostic(kind: string, error: unknown): Promise<void> {
  const path = diagnosticPath()
  // Keep technical frames and known file paths, never arbitrary messages or records.
  const frames = (value: unknown, depth = 0): string => {
    if (!(value instanceof Error) || depth > 4) return 'UnknownError'
    const filePath = (value as Error & { filePath?: string }).filePath
    return `${value.name}${filePath ? ` file=${filePath}` : ''}\n${value.stack?.split('\n').filter(line => /^\s+at /.test(line)).join('\n') ?? ''}\n${value.cause ? frames(value.cause, depth + 1) : ''}`
  }
  const technical = frames(error)
  try {
    await mkdir(join(app.getPath('userData'), 'logs'), { recursive: true })
    await appendFile(path, `${new Date().toISOString()} appVersion=${app.getVersion()} ${kind}\n${technical}\n`, 'utf8')
  } catch { console.error('[startup] diagnostic file could not be written') }
}

export async function showStartupFailure(kind: string, error: unknown): Promise<void> {
  await recordDiagnostic(kind, error)
  if (shown) return
  shown = true
  dialog.showErrorBox('启动失败', `应用未能正常启动。数据未被自动删除。\n请查看本地诊断信息，或重新启动后从备份恢复。\n诊断日志：${diagnosticPath()}`)
}

export function registerStartupDiagnostics(): void {
  process.on('uncaughtException', error => { void showStartupFailure('uncaughtException', error) })
  process.on('unhandledRejection', error => { void showStartupFailure('unhandledRejection', error) })
  ipcMain.on('diagnostics:rendererFailure', (_event, kind: unknown) => {
    // No arbitrary renderer payload or business content is written to the log.
    void showStartupFailure(kind === 'render' ? 'renderer-render-failed' : 'renderer-startup-failed', new Error('Renderer failed'))
  })
}
