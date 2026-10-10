import { contextBridge, ipcRenderer } from 'electron'
import { createAppApi, type AppApi } from '../shared/appApi'
import { APP_UPDATE_STATUS_EVENT, parseAppUpdateStatus } from '../shared/appUpdate'

contextBridge.exposeInMainWorld('startupDiagnostics', {
  report: () => ipcRenderer.send('diagnostics:rendererFailure', 'render')
})

const electronAPI: AppApi = createAppApi((channel, ...args) => ipcRenderer.invoke(channel, ...args))

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

contextBridge.exposeInMainWorld('appUpdateEvents', {
  subscribe: (listener: (status: unknown) => void) => {
    const handler = (_event: unknown, status: unknown) => {
      listener(parseAppUpdateStatus(status))
    }
    ipcRenderer.on(APP_UPDATE_STATUS_EVENT, handler)
    return () => {
      ipcRenderer.removeListener(APP_UPDATE_STATUS_EVENT, handler)
    }
  }
})
