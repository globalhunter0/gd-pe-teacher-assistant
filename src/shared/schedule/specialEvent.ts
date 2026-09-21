/** 升旗、大课间等不是行政班体育课。与课表导入识别共用同一规则。 */
export function isScheduleSpecialEventText(text: string): boolean {
  return /升旗|仪式|大课间|课间操|值班|教研|会议|活动/.test(text)
}
