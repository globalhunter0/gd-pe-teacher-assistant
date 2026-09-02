import type { Period, ScheduleItem } from './types'

function item(
  weekday: ScheduleItem['weekday'],
  period: Period,
  startTime: string,
  endTime: string,
  team: string,
  courseType: ScheduleItem['courseType'] = 'regular'
): ScheduleItem {
  return {
    id: `w${weekday}-p${period}`,
    weekday,
    period,
    startTime,
    endTime,
    team,
    courseType
  }
}

export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  item(1, 5, '11:40', '12:20', '团队1', 'big'),

  item(2, 3, '10:00', '10:40', '团队3'),
  item(2, 4, '10:50', '11:30', '团队2'),
  item(2, 5, '11:40', '12:20', '团队5'),
  item(2, 7, '15:10', '15:50', '团队4'),

  item(3, 2, '08:50', '09:30', '团队5'),
  item(3, 3, '10:00', '10:40', '团队3'),
  item(3, 6, '14:15', '14:55', '团队2'),
  item(3, 7, '15:10', '15:50', '团队4'),

  item(4, 3, '10:00', '10:40', '团队2'),
  item(4, 5, '11:40', '12:20', '团队5'),
  item(4, 7, '15:10', '15:50', '团队3'),
  item(4, 8, '16:05', '16:45', '团队4'),

  item(5, 4, '10:50', '11:30', '团队5'),
  item(5, 5, '11:40', '12:20', '团队2'),
  item(5, 6, '14:15', '14:55', '团队4'),
  item(5, 8, '16:05', '16:45', '团队3')
]
