# 广东省初中体育教师管理助手

面向广东省初中体育教师的 Windows 11 本地桌面软件。当前为第一阶段：**项目基础框架**。尚未接入数据库、Excel、备份或 AI 功能。

## 环境要求

- Windows 11
- Node.js 20 或更高版本（本机已使用 Node.js 24）
- npm（随 Node.js 安装）

## 安装依赖

在项目根目录执行：

```bash
npm install
```

## 开发运行

同时启动 Vite 开发服务和 Electron 窗口：

```bash
npm run dev
```

启动后会打开桌面窗口。左侧可切换功能页面，工作台显示基础信息卡片。

## 生产构建

```bash
npm run build
```

构建产物输出到 `out/` 目录。当前阶段仅完成开发框架，尚未配置安装包打包。

## 安全说明

- 渲染进程（界面）不能直接使用完整 Node.js 权限
- 已开启 `contextIsolation`
- 通过 `preload` 向界面暴露有限接口
- 未关闭 Electron 安全机制

## 项目结构

```text
src/
  main/          Electron 主进程
  preload/       预加载脚本（安全桥接）
  renderer/      React 界面
```
