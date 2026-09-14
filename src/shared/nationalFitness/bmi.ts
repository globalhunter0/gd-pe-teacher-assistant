export type DeriveNationalFitnessBmiResult =
  | { ok: true; bmi: number; unitLabel: 'kg/m²' }
  | { ok: false; code: 'INVALID_VALUE'; message: string }

/**
 * 仅派生 BMI 数值，不评分、不定级。
 * BMI = 体重(kg) / (身高(m))²
 */
export function deriveNationalFitnessBmi(heightCm: number, weightKg: number): DeriveNationalFitnessBmiResult {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) {
    return { ok: false, code: 'INVALID_VALUE', message: '身高或体重不正确，无法计算 BMI' }
  }
  const heightM = heightCm / 100
  return { ok: true, bmi: weightKg / (heightM * heightM), unitLabel: 'kg/m²' }
}
