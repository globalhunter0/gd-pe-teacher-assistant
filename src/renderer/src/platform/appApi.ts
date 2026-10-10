import type { AppApi } from '@shared/appApi'
import type { AppUpdateStatus } from '@shared/appUpdate'

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

export function subscribeAppUpdateStatus(listener: (status: AppUpdateStatus) => void): () => void {
  if (window.appUpdateEvents?.subscribe) {
    return window.appUpdateEvents.subscribe(listener)
  }

  let cancelled = false
  let timer: ReturnType<typeof setInterval> | undefined
  void getAppApi().then((api) => {
    if (cancelled) {
      return
    }
    const poll = () => {
      void api.appUpdate.getStatus().then((status) => {
        if (!cancelled) {
          listener(status)
        }
      })
    }
    poll()
    timer = setInterval(poll, 1000)
  })
  return () => {
    cancelled = true
    if (timer !== undefined) {
      clearInterval(timer)
    }
  }
}
