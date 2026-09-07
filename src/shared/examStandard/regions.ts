import type { ExamStandard, GdCity } from './types'

export const GD_CITIES: GdCity[] = [
  { cityCode: '440100', citySlug: 'guangzhou', cityName: '广州' },
  { cityCode: '440300', citySlug: 'shenzhen', cityName: '深圳' },
  { cityCode: '440400', citySlug: 'zhuhai', cityName: '珠海' },
  { cityCode: '440500', citySlug: 'shantou', cityName: '汕头' },
  { cityCode: '440600', citySlug: 'foshan', cityName: '佛山' },
  { cityCode: '440200', citySlug: 'shaoguan', cityName: '韶关' },
  { cityCode: '441600', citySlug: 'heyuan', cityName: '河源' },
  { cityCode: '441400', citySlug: 'meizhou', cityName: '梅州' },
  { cityCode: '441300', citySlug: 'huizhou', cityName: '惠州' },
  { cityCode: '441500', citySlug: 'shanwei', cityName: '汕尾' },
  { cityCode: '441900', citySlug: 'dongguan', cityName: '东莞' },
  { cityCode: '442000', citySlug: 'zhongshan', cityName: '中山' },
  { cityCode: '440700', citySlug: 'jiangmen', cityName: '江门' },
  { cityCode: '441700', citySlug: 'yangjiang', cityName: '阳江' },
  { cityCode: '440800', citySlug: 'zhanjiang', cityName: '湛江' },
  { cityCode: '440900', citySlug: 'maoming', cityName: '茂名' },
  { cityCode: '441200', citySlug: 'zhaoqing', cityName: '肇庆' },
  { cityCode: '441800', citySlug: 'qingyuan', cityName: '清远' },
  { cityCode: '445100', citySlug: 'chaozhou', cityName: '潮州' },
  { cityCode: '445200', citySlug: 'jieyang', cityName: '揭阳' },
  { cityCode: '445300', citySlug: 'yunfu', cityName: '云浮' }
]

export const GD_PROVINCE: GdCity = {
  cityCode: '440000',
  citySlug: 'guangdong',
  cityName: '广东省'
}

export function findGdCity(citySlug: string): GdCity | undefined {
  return GD_CITIES.find((item) => item.citySlug === citySlug)
}

export function standardsForCity(standards: readonly ExamStandard[], citySlug: string): ExamStandard[] {
  return standards.filter((item) => item.citySlug === citySlug && item.examType === 'middle_school_exam')
}

export function verifiedStandardsForCity(standards: readonly ExamStandard[], citySlug: string): ExamStandard[] {
  return standardsForCity(standards, citySlug).filter((item) => item.status === 'verified')
}
