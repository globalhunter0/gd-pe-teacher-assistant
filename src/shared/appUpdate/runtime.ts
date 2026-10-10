export const APP_UPDATE_STARTUP_CHECK_DELAY_MS = 8000
export const APP_UPDATE_DISABLE_ENV = 'GDPE_DISABLE_AUTO_UPDATE'
export const APP_UPDATE_ISOLATED_TEST_ENV = 'GDPE_RC_TEST_ROOT'
export const APP_UPDATE_NSIS_UNINSTALLER = 'Uninstall gd-pe-teacher-assistant.exe'

export interface DesktopAutoUpdateEnablement {
  isPackaged: boolean
  rendererDevUrl?: string | null
  isolatedTestRoot?: string | null
  disableFlag?: string | null
  hasUpdateYml: boolean
  hasNsisUninstaller: boolean
}

export function canEnableDesktopAutoUpdate(input: DesktopAutoUpdateEnablement): boolean {
  if (!input.isPackaged) {
    return false
  }
  if (input.rendererDevUrl) {
    return false
  }
  if (input.isolatedTestRoot) {
    return false
  }
  if (input.disableFlag === '1') {
    return false
  }
  return input.hasUpdateYml && input.hasNsisUninstaller
}

function looksLikeAutoUpdater(value: unknown): value is { autoDownload: unknown } {
  if (value == null || typeof value !== 'object') {
    return false
  }
  return 'autoDownload' in value && 'checkForUpdates' in value
}

/** electron-updater is CJS; ESM import/require interop may put the getter on default. */
export function resolveElectronUpdaterExport(mod: unknown): { autoDownload: unknown } | null {
  if (!looksLikeAutoUpdater(mod)) {
    if (!mod || typeof mod !== 'object') {
      return null
    }
    const record = mod as Record<string, unknown>
    if (looksLikeAutoUpdater(record.autoUpdater)) {
      return record.autoUpdater
    }
    const nestedDefault = record.default
    if (looksLikeAutoUpdater(nestedDefault)) {
      return nestedDefault
    }
    if (nestedDefault && typeof nestedDefault === 'object') {
      const nested = nestedDefault as Record<string, unknown>
      if (looksLikeAutoUpdater(nested.autoUpdater)) {
        return nested.autoUpdater
      }
    }
    return null
  }
  return mod
}
