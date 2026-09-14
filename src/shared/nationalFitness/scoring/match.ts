import type { NationalFitnessBonusBand, NationalFitnessRangeBand, NationalFitnessThresholdBand } from './types'

const EPS = 1e-9

export function rangeContains(band: NationalFitnessRangeBand, value: number): boolean {
  if (band.min !== null) {
    if (band.minInclusive) {
      if (value < band.min - EPS) {
        return false
      }
    } else if (value <= band.min + EPS) {
      return false
    }
  }
  if (band.max !== null) {
    if (band.maxInclusive) {
      if (value > band.max + EPS) {
        return false
      }
    } else if (value >= band.max - EPS) {
      return false
    }
  }
  return true
}

export function rangesOverlap(left: NationalFitnessRangeBand, right: NationalFitnessRangeBand): boolean {
  if (left.max !== null && right.min !== null) {
    if (left.max < right.min) {
      return false
    }
    if (left.max === right.min && (!left.maxInclusive || !right.minInclusive)) {
      return false
    }
  }
  if (right.max !== null && left.min !== null) {
    if (right.max < left.min) {
      return false
    }
    if (right.max === left.min && (!right.maxInclusive || !left.minInclusive)) {
      return false
    }
  }
  return true
}

export function matchHigherBetter(entries: NationalFitnessThresholdBand[], value: number): NationalFitnessThresholdBand | null {
  const ordered = [...entries].sort((a, b) => b.score - a.score)
  for (const entry of ordered) {
    if (entry.inclusive ? value + EPS >= entry.threshold : value > entry.threshold + EPS) {
      return entry
    }
  }
  return null
}

export function matchLowerBetter(entries: NationalFitnessThresholdBand[], value: number): NationalFitnessThresholdBand | null {
  const ordered = [...entries].sort((a, b) => b.score - a.score)
  for (const entry of ordered) {
    if (entry.inclusive ? value - EPS <= entry.threshold : value < entry.threshold - EPS) {
      return entry
    }
  }
  return null
}

export function matchBonusByExtra(entries: NationalFitnessBonusBand[], extra: number): NationalFitnessBonusBand | null {
  const ordered = [...entries].sort((a, b) => b.bonusScore - a.bonusScore)
  for (const entry of ordered) {
    if (extra + EPS >= entry.extra) {
      return entry
    }
  }
  return null
}
