import type { AppApi } from '@shared/appApi'

/** The only renderer file allowed to read window.electronAPI. Pages and dialogs use getAppApi(). */
export async function getAppApi(): Promise<AppApi> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (window.electronAPI) {
      return window.electronAPI
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 50)
    })
  }
  throw new Error('应用接口未加载。请完全退出应用后重新打开，不要只刷新页面。')
}
