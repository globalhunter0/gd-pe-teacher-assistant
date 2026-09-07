import { app } from 'electron'
import { join } from 'node:path'

export function getUserDataRoot(): string {
  return app.getPath('userData')
}

export function userDataFile(fileName: string): string {
  return join(getUserDataRoot(), fileName)
}
