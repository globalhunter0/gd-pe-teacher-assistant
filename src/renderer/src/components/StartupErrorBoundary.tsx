import { Component, type ReactNode } from 'react'

export class StartupErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true } }
  componentDidCatch(): void {
    (window as unknown as { startupDiagnostics?: { report: () => void } }).startupDiagnostics?.report()
  }
  render(): ReactNode {
    if (this.state.failed) return <main role="alert"><h1>启动失败</h1><p>数据未被自动删除。请重新启动或查看用户数据目录 logs/startup.log；也可以尝试从备份恢复。</p></main>
    return this.props.children
  }
}
