let mainWindow: import('electron').BrowserWindow | null = null

export function setMainWindow(window: import('electron').BrowserWindow | null): void {
  mainWindow = window
}

export function getMainWindow(): import('electron').BrowserWindow | null {
  return mainWindow
}
