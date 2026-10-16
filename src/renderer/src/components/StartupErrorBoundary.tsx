import { Component, type ReactNode } from 'react'

export class StartupErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string }> {
  state = { failed: false, message: '' }
  static getDerivedStateFromError(error: unknown): { failed: boolean; message: string } {
    const message = error instanceof Error ? error.message : '未知错误'
    return { failed: true, message }
  }
  componentDidCatch(error: unknown): void {
    console.error(error)
    ;(window as unknown as { startupDiagnostics?: { report: () => void } }).startupDiagnostics?.report()
  }
  render(): ReactNode {
    if (this.state.failed) {
      return (
        <main role="alert">
          <h1>启动失败</h1>
          <p>{this.state.message || '页面没有完成加载。请刷新后再试。'}</p>
        </main>
      )
    }
    return this.props.children
  }
}
