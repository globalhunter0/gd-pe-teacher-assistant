import { contextBridge } from 'electron'

const appBridge = {
  name: '广东省初中体育教师管理助手',
  version: '0.1.0'
} as const

contextBridge.exposeInMainWorld('appBridge', appBridge)
