import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserAppApi } from '@shared/companion'
import CompanionApp from '@renderer/companion/CompanionApp'
import { StartupErrorBoundary } from '@renderer/components/StartupErrorBoundary'
import '@renderer/styles/global.css'
import { createIdbCompanionStore } from './idbStore'

const store = createIdbCompanionStore()
window.electronAPI = createBrowserAppApi(store)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('未找到应用根节点')
}

createRoot(rootElement).render(
  <StrictMode>
    <StartupErrorBoundary>
      <CompanionApp />
    </StartupErrorBoundary>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/'
    void navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* offline cache is best-effort */
    })
  })
}
