import type { QuickEntryAction } from './apply'

export type QuickEntryStatusShortcut = Extract<QuickEntryAction['type'], 'absent' | 'exempt' | 'pending'>

/** 成绩框为空时，A/E/P 不区分大小写、Caps Lock、Shift。 */
export function resolveQuickEntryStatusShortcut(options: {
  key: string
  code?: string
  inputText: string
}): QuickEntryStatusShortcut | null {
  if (options.inputText.trim() !== '') {
    return null
  }

  const letter = options.key.length === 1 ? options.key.toLowerCase() : ''
  const code = options.code ?? ''

  if (letter === 'a' || code === 'KeyA') {
    return 'absent'
  }
  if (letter === 'e' || code === 'KeyE') {
    return 'exempt'
  }
  if (letter === 'p' || code === 'KeyP') {
    return 'pending'
  }
  return null
}
