import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isAllowedExternalUrl, isAllowedRendererNavigation } from './externalUrl'
import { parseResourceUrl } from '../resource/validate'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

export function runWindowNavigationSelfCheck(): void {
  assert(isAllowedExternalUrl('https://jyj.gz.gov.cn/notice'), 'https 外链必须放行')
  assert(isAllowedExternalUrl('http://edu.foshan.gov.cn/notice'), 'http 外链必须放行')
  assert(!isAllowedExternalUrl('javascript:alert(1)'), 'javascript: 不得打开')
  assert(!isAllowedExternalUrl('file:///C:/Windows/notepad.exe'), 'file: 不得当外链打开')
  assert(!isAllowedExternalUrl('data:text/html,hi'), 'data: 不得打开')
  assert(!isAllowedExternalUrl('mailto:teacher@example.com'), 'mailto: 不得打开')
  assert(!isAllowedExternalUrl('https://user:secret@evil.example/'), '带账号密码的外链不得打开')
  assert(!isAllowedExternalUrl('not a url'), '非法地址不得打开')

  const dev = { devServerUrl: 'http://localhost:5173/' }
  assert(isAllowedRendererNavigation('http://localhost:5173/', dev), '开发服务器首页可以留在主窗口')
  assert(isAllowedRendererNavigation('http://localhost:5173/index.html?x=1', dev), '开发服务器同主机刷新可以留在主窗口')
  assert(!isAllowedRendererNavigation('https://example.com/', dev), '开发模式下外网不得占住主窗口')
  assert(!isAllowedRendererNavigation('file:///C:/temp/index.html', dev), '开发模式下本地文件不得占住主窗口')

  const packaged = { rendererFileUrl: 'file:///D:/app/out/renderer/index.html' }
  assert(
    isAllowedRendererNavigation('file:///D:/app/out/renderer/index.html#settings', packaged),
    '安装版只允许主窗口停在自己的页面'
  )
  assert(!isAllowedRendererNavigation('file:///C:/Windows/win.ini', packaged), '安装版不得导航到其它本地文件')
  assert(!isAllowedRendererNavigation('https://example.com/', packaged), '安装版外网不得占住主窗口')

  let rejected = false
  try {
    parseResourceUrl('javascript:alert(1)')
  } catch {
    rejected = true
  }
  assert(rejected, '资料链接必须复用同一条外链规则')

  const mainIndex = readSrc('src/main/index.ts')
  const guards = readSrc('src/main/windowGuards.ts')
  assert(mainIndex.includes('installMainWindowNavigationGuards'), '主窗口必须安装导航防护')
  assert(!/shell\.openExternal\(details\.url\)/.test(mainIndex), '主窗口不得再无校验地打开任意 URL')
  assert(guards.includes('will-navigate'), '必须拦截主窗口导航')
  assert(guards.includes('setWindowOpenHandler'), '必须拦截新窗口')
  assert(guards.includes('isAllowedExternalUrl'), '打开外链前必须校验协议')
  assert(guards.includes('event.preventDefault()'), '不允许的导航必须取消')
}

export function runWindowNavigationSelfCheckOrThrow(): string {
  runWindowNavigationSelfCheck()
  return 'window navigation self-check passed'
}
