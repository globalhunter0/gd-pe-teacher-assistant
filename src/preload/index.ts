import { contextBridge, ipcRenderer } from 'electron'
import { createAppApi, type AppApi } from '../shared/appApi'

contextBridge.exposeInMainWorld('startupDiagnostics', {
  report: () => ipcRenderer.send('diagnostics:rendererFailure', 'render')
})

const electronAPI: AppApi = createAppApi((channel, ...args) => ipcRenderer.invoke(channel, ...args))

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
