export const DEFAULT_TEACHER_DISPLAY_NAME = ''
export const LEGACY_DEFAULT_TEACHER_DISPLAY_NAME = '郁老师'

export const USER_PREFERENCES_FILE = 'settings.json'

export interface UserPreferences {
  teacherDisplayName: string
}

export function defaultUserPreferences(): UserPreferences {
  return { teacherDisplayName: DEFAULT_TEACHER_DISPLAY_NAME }
}
