import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_RELEASE_VERSION } from './backup/types'
import { APP_VERSION, formatAppVersion } from './appVersion'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf8')
}

export function runAppVersionSelfCheckOrThrow(): string {
  const developmentLabel = formatAppVersion(true)
  const productionLabel = formatAppVersion(false)

  assert(APP_VERSION === '0.29.0', 'APP_VERSION 必须是 0.29.0')
  assert(developmentLabel === 'v0.29.0-dev', 'development 格式必须是 v0.29.0-dev')
  assert(productionLabel === 'v0.29.0', 'production 格式必须是 v0.29.0')
  assert(developmentLabel !== 'v0.28.0-dev', '当前开发版本不得再是 v0.28.0-dev')
  assert(developmentLabel !== 'v0.27.0-dev', '当前开发版本不得再是 v0.27.0-dev')
  assert(developmentLabel !== 'v0.24.0-dev', '当前开发版本不得再是 v0.24.0-dev')
  assert(developmentLabel !== 'v0.14.0-dev', '当前开发版本不得再是 v0.14.0-dev')
  assert(!productionLabel.includes('-dev'), 'production 格式绝不能包含 -dev')
  assert(APP_RELEASE_VERSION === APP_VERSION, '备份清单 appVersion 必须与 APP_VERSION 同源')

  const pkg = JSON.parse(readSrc('../../package.json')) as { version?: string }
  assert(pkg.version === APP_VERSION, 'package.json version 必须与 APP_VERSION 一致')

  const lock = JSON.parse(readSrc('../../package-lock.json')) as {
    version?: string
    packages?: { '': { version?: string } }
  }
  assert(lock.version === APP_VERSION, 'package-lock.json version 必须与 APP_VERSION 一致')
  assert(lock.packages?.['']?.version === APP_VERSION, 'package-lock 根包 version 必须与 APP_VERSION 一致')

  const versionSource = readSrc('./appVersion.ts')
  assert(!versionSource.includes("APP_VERSION_CHANNEL = 'dev'"), '不得再硬编码 APP_VERSION_CHANNEL = dev')
  assert(versionSource.includes('formatAppVersion'), 'shared 层必须提供 formatAppVersion')

  const labelSource = readSrc('../renderer/src/appVersionLabel.ts')
  assert(labelSource.includes('formatAppVersion(import.meta.env.DEV)'), '可见版本必须按 Vite DEV/PROD 环境格式化')

  const sidebar = readSrc('../renderer/src/components/Sidebar.tsx')
  assert(sidebar.includes('APP_VERSION_LABEL'), '侧栏必须使用同一套可见版本标签')
  assert(!sidebar.includes('v0.14.0-dev'), '侧栏不得再硬编码 v0.14.0-dev')
  assert(!sidebar.includes('-dev'), '侧栏不得自行拼接 -dev')

  const settings = readSrc('../renderer/src/pages/SettingsPage.tsx')
  assert(settings.includes('APP_VERSION_LABEL'), '设置页必须使用同一套可见版本标签')
  assert(!settings.includes('应用版本：0.14.0'), '设置页不得再硬编码 0.14.0')
  assert(!settings.includes('v0.14.0-dev'), '设置页不得再硬编码 v0.14.0-dev')
  assert(!settings.includes('-dev'), '设置页不得自行拼接 -dev')

  const backupTypes = readSrc('./backup/types.ts')
  assert(backupTypes.includes('APP_VERSION'), 'APP_RELEASE_VERSION 必须复用 APP_VERSION')
  assert(!backupTypes.includes("'0.13.1'"), '备份类型不得再硬编码 0.13.1')

  return 'app version self-check passed'
}
