import {
  DEFAULT_TEACHER_DISPLAY_NAME,
  LEGACY_DEFAULT_TEACHER_DISPLAY_NAME,
  defaultUserPreferences,
  type UserPreferences
} from './types'

const MAX_DISPLAY_NAME_LENGTH = 40

export function normalizeTeacherDisplayName(input: unknown): string {
  if (typeof input !== 'string') {
    return DEFAULT_TEACHER_DISPLAY_NAME
  }
  const trimmed = input.trim()
  if (!trimmed || trimmed === LEGACY_DEFAULT_TEACHER_DISPLAY_NAME) {
    return DEFAULT_TEACHER_DISPLAY_NAME
  }
  return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH)
}

export function parseUserPreferences(input: unknown): UserPreferences {
  if (input == null) {
    return defaultUserPreferences()
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    return defaultUserPreferences()
  }
  const record = input as { teacherDisplayName?: unknown }
  return {
    teacherDisplayName: normalizeTeacherDisplayName(record.teacherDisplayName)
  }
}

export function formatWorkbenchGreeting(greeting: string, teacherDisplayName: string): string {
  const name = teacherDisplayName.trim()
  return name ? `${greeting}，${name}！` : `${greeting}！`
}
