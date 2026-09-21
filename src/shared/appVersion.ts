/** Canonical product version. Keep package.json `version` identical. */
export const APP_VERSION = '0.27.0'

export function formatAppVersion(isDev: boolean): string {
  return isDev ? `v${APP_VERSION}-dev` : `v${APP_VERSION}`
}
