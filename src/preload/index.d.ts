export interface AppBridge {
  readonly name: string
  readonly version: string
}

declare global {
  interface Window {
    appBridge: AppBridge
  }
}

export {}
