export {
  APP_UPDATE_INSTALL_KINDS,
  APP_UPDATE_STATES,
  APP_UPDATE_STATUS_EVENT,
  isAppUpdateInstallKind,
  isAppUpdateState,
  parseAppUpdateStatus,
  shouldPromptAppUpdate,
  unsupportedAppUpdateStatus,
  type AppUpdateInstallKind,
  type AppUpdateState,
  type AppUpdateStatus
} from './types'
export {
  APP_UPDATE_DISABLE_ENV,
  APP_UPDATE_ISOLATED_TEST_ENV,
  APP_UPDATE_NSIS_UNINSTALLER,
  APP_UPDATE_STARTUP_CHECK_DELAY_MS,
  canEnableDesktopAutoUpdate,
  type DesktopAutoUpdateEnablement
} from './runtime'
