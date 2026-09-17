import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_RELEASE_VERSION } from './backup/types'
import { APP_VERSION, APP_VERSION_DISPLAY } from './appVersion'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf8')
}

export function runAppVersionSelfCheckOrThrow(): string {
  assert(APP_VERSION === '0.24.0', 'APP_VERSION 必须是 0.24.0')
  assert(APP_VERSION_DISPLAY === 'v0.24.0-dev', '开发版可见版本必须是 v0.24.0-dev')
  assert(APP_RELEASE_VERSION === APP_VERSION, '备份清单 appVersion 必须与 APP_VERSION 同源')

  const pkg = JSON.parse(readSrc('../../package.json')) as { version?: string }
  assert(pkg.version === APP_VERSION, 'package.json version 必须与 APP_VERSION 一致')

  const lock = JSON.parse(readSrc('../../package-lock.json')) as {
    version?: string
    packages?: { '': { version?: string } }
  }
  assert(lock.version === APP_VERSION, 'package-lock.json version 必须与 APP_VERSION 一致')
  assert(lock.packages?.['']?.version === APP_VERSION, 'package-lock 根包 version 必须与 APP_VERSION 一致')

  const sidebar = readSrc('../renderer/src/components/Sidebar.tsx')
  assert(sidebar.includes('APP_VERSION_DISPLAY'), '侧栏必须显示 APP_VERSION_DISPLAY')
  assert(!sidebar.includes('v0.14.0-dev'), '侧栏不得再硬编码 v0.14.0-dev')

  const settings = readSrc('../renderer/src/pages/SettingsPage.tsx')
  assert(settings.includes('APP_VERSION_DISPLAY'), '设置页必须显示 APP_VERSION_DISPLAY')
  assert(!settings.includes('应用版本：0.14.0'), '设置页不得再硬编码 0.14.0')

  const backupTypes = readSrc('./backup/types.ts')
  assert(backupTypes.includes('APP_VERSION'), 'APP_RELEASE_VERSION 必须复用 APP_VERSION')
  assert(!backupTypes.includes("'0.13.1'"), '备份类型不得再硬编码 0.13.1')

  return 'app version self-check passed'
}
