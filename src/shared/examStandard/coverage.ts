import { GD_CITIES, standardsForCity } from './regions'
import { EXAM_STATUS_LABELS, type ExamStandard, type ExamStandardStatus, type GdCity } from './types'

export type CityCoverageStatus = 'verified' | 'scheme_verified' | 'partial' | 'pending' | 'missing'

export const CITY_COVERAGE_LABELS: Record<CityCoverageStatus, string> = {
  verified: '已核验',
  scheme_verified: '规则已核验',
  partial: '部分核验',
  pending: '资料核验中',
  missing: '未收录'
}

export function cityCoverageStatus(
  standards: readonly ExamStandard[],
  citySlug: string
): CityCoverageStatus {
  const cityStandards = standardsForCity(standards, citySlug)
  if (cityStandards.some((item) => item.status === 'verified' && item.scoreTableStatus === 'verified')) {
    return 'verified'
  }
  if (cityStandards.some((item) => item.ruleStatus === 'verified' && item.scoreTableStatus === 'missing')) {
    return 'scheme_verified'
  }
  if (cityStandards.some((item) => item.status === 'partial' || item.scoreTableStatus === 'partial')) {
    return 'partial'
  }
  if (cityStandards.some((item) => item.status === 'draft')) {
    return 'pending'
  }
  return 'missing'
}

export interface CityCoverageRow {
  city: GdCity
  coverage: CityCoverageStatus
  coverageLabel: string
  versions: ExamStandard[]
}

export function listGuangdongCityCoverage(standards: readonly ExamStandard[]): CityCoverageRow[] {
  return GD_CITIES.map((city) => {
    const coverage = cityCoverageStatus(standards, city.citySlug)
    return {
      city,
      coverage,
      coverageLabel: CITY_COVERAGE_LABELS[coverage],
      versions: standardsForCity(standards, city.citySlug)
    }
  })
}

export function coverageTone(coverage: CityCoverageStatus): 'ok' | 'info' | 'warn' | 'muted' {
  if (coverage === 'verified') {
    return 'ok'
  }
  if (coverage === 'scheme_verified') {
    return 'info'
  }
  if (coverage === 'partial') {
    return 'info'
  }
  if (coverage === 'pending') {
    return 'warn'
  }
  return 'muted'
}

export function statusBadgeTone(status: ExamStandardStatus): 'ok' | 'info' | 'warn' | 'danger' | 'muted' {
  if (status === 'verified') {
    return 'ok'
  }
  if (status === 'partial') {
    return 'info'
  }
  if (status === 'deprecated') {
    return 'danger'
  }
  return 'warn'
}

export function statusDisplayLabel(status: ExamStandardStatus): string {
  return EXAM_STATUS_LABELS[status]
}
