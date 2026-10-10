/** Only http/https may leave the app. javascript:, file:, data: and similar stay blocked. */
export function isAllowedExternalUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim())
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.username === '' &&
      parsed.password === ''
    )
  } catch {
    return false
  }
}

export function isAllowedRendererNavigation(
  url: string,
  allowed: { devServerUrl?: string; rendererFileUrl?: string }
): boolean {
  try {
    const next = new URL(url)
    if (allowed.devServerUrl) {
      const dev = new URL(allowed.devServerUrl)
      return next.protocol === dev.protocol && next.host === dev.host
    }
    if (allowed.rendererFileUrl) {
      const file = new URL(allowed.rendererFileUrl)
      return (
        next.protocol === 'file:' &&
        file.protocol === 'file:' &&
        normalizeFilePath(next.pathname) === normalizeFilePath(file.pathname)
      )
    }
    return false
  } catch {
    return false
  }
}

function normalizeFilePath(pathname: string): string {
  return decodeURIComponent(pathname).replace(/\\/g, '/').toLowerCase()
}
