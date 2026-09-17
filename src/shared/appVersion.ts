/** Canonical product version. Keep package.json `version` identical. */
export const APP_VERSION = '0.24.0'

export const APP_VERSION_CHANNEL = 'dev' as const

export const APP_VERSION_DISPLAY = `v${APP_VERSION}-${APP_VERSION_CHANNEL}`
