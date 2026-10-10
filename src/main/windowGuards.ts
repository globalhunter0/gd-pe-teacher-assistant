import { shell, type WebContents } from 'electron'
import { isAllowedExternalUrl, isAllowedRendererNavigation } from '../shared/security/externalUrl'

export function installMainWindowNavigationGuards(
  contents: WebContents,
  allowed: { devServerUrl?: string; rendererFileUrl?: string }
): void {
  contents.setWindowOpenHandler((details) => {
    if (isAllowedExternalUrl(details.url)) {
      void shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  contents.on('will-navigate', (event, url) => {
    if (isAllowedRendererNavigation(url, allowed)) {
      return
    }
    event.preventDefault()
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url)
    }
  })
}
