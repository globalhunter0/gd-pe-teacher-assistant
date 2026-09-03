import { useEffect, useId, useState } from 'react'
import {
  TEST_CATEGORIES,
  TEST_CATEGORY_LABELS,
  TEST_DIRECTIONS,
  TEST_DIRECTION_LABELS,
  TEST_GENDER_RULES,
  TEST_GENDER_RULE_LABELS,
  TEST_UNITS,
  TEST_UNIT_LABELS,
  TEST_VALUE_TYPES,
  TEST_VALUE_TYPE_LABELS,
  TIME_INPUT_MODES,
  TIME_INPUT_MODE_LABELS,
  createTestItemId,
  type TestCategory,
  type TestDirection,
  type TestGenderRule,
  type TestItem,
  type TestUnit,
  type TestValueType,
  type TimeInputMode
} from '@shared/peTest'

interface TestItemEditorDialogProps {
  record: TestItem | null
  onClose: () => void
  onSave: (item: TestItem) => Promise<void>
}

export default function TestItemEditorDialog({
  record,
  onClose,
  onSave
}: TestItemEditorDialogProps): React.JSX.Element {
  const titleId = useId()
  const isEdit = record !== null
  const [name, setName] = useState(record?.name ?? '')
  const [category, setCategory] = useState<TestCategory>(record?.category ?? 'other')
  const [valueType, setValueType] = useState<TestValueType>(record?.valueType ?? 'number')
  const [timeInputMode, setTimeInputMode] = useState<TimeInputMode>(record?.timeInputMode ?? 'seconds')
  const [unit, setUnit] = useState<TestUnit>(record?.unit ?? 'times')
  const [customUnitLabel, setCustomUnitLabel] = useState(record?.customUnitLabel ?? '')
  const [direction, setDirection] = useState<TestDirection>(record?.direction ?? 'higherBetter')
  const [genderRule, setGenderRule] = useState<TestGenderRule>(record?.genderRule ?? 'all')
  const [decimalPlaces, setDecimalPlaces] = useState(String(record?.decimalPlaces ?? 0))
  const [minValue, setMinValue] = useState(record?.minValue === null || record?.minValue === undefined ? '' : String(record.minValue))
  const [maxValue, setMaxValue] = useState(record?.maxValue === null || record?.maxValue === undefined ? '' : String(record.maxValue))
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function parseOptional(text: string, label: string): number | null {
    const trimmed = text.trim()
    if (trimmed === '') {
      return null
    }

    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new Error(`${label}必须是数字`)
    }

    return Number(trimmed)
  }

  async function handleSave(): Promise<void> {
    const places = Number(decimalPlaces)
    if (!Number.isInteger(places) || places < 0 || places > 2) {
      setFormError('小数位数必须是 0、1 或 2')
      return
    }

    try {
      const now = new Date().toISOString()
      setSaving(true)
      setFormError(null)
      await onSave({
        id: record?.id ?? createTestItemId(),
        builtinKey: null,
        name: name.trim(),
        category,
        valueType,
        timeInputMode: valueType === 'time' ? timeInputMode : 'seconds',
        unit,
        customUnitLabel: customUnitLabel.trim(),
        direction,
        genderRule,
        decimalPlaces: places,
        minValue: parseOptional(minValue, '最小值'),
        maxValue: parseOptional(maxValue, '最大值'),
        isBuiltin: false,
        isActive: record?.isActive ?? true,
        notes: notes.trim(),
        createdAt: record?.createdAt ?? now,
        updatedAt: now
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--class"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{isEdit ? '编辑自定义项目' : '新建自定义项目'}</h3>
        <p className="dialog-slot">自定义项目可停用或删除（已被测试引用时只能停用）。本版不含国家体测评分。</p>
        <div className="dialog-grid">
          <label className="dialog-span">
            项目名称 *
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            分类
            <select value={category} onChange={(event) => setCategory(event.target.value as TestCategory)}>
              {TEST_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {TEST_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            值类型
            <select
              value={valueType}
              onChange={(event) => {
                const next = event.target.value as TestValueType
                setValueType(next)
                if (next !== 'time') {
                  setTimeInputMode('seconds')
                }
              }}
            >
              {TEST_VALUE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {TEST_VALUE_TYPE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          {valueType === 'time' ? (
            <label className="dialog-span">
              时间录入方式
              <select value={timeInputMode} onChange={(event) => setTimeInputMode(event.target.value as TimeInputMode)}>
                {TIME_INPUT_MODES.map((item) => (
                  <option key={item} value={item}>
                    {TIME_INPUT_MODE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            单位
            <select value={unit} onChange={(event) => setUnit(event.target.value as TestUnit)}>
              {TEST_UNITS.map((item) => (
                <option key={item} value={item}>
                  {TEST_UNIT_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          {unit === 'other' ? (
            <label>
              自定义单位 *
              <input value={customUnitLabel} onChange={(event) => setCustomUnitLabel(event.target.value)} />
            </label>
          ) : null}
          <label>
            成绩方向
            <select value={direction} onChange={(event) => setDirection(event.target.value as TestDirection)}>
              {TEST_DIRECTIONS.map((item) => (
                <option key={item} value={item}>
                  {TEST_DIRECTION_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            适用性别
            <select value={genderRule} onChange={(event) => setGenderRule(event.target.value as TestGenderRule)}>
              {TEST_GENDER_RULES.map((item) => (
                <option key={item} value={item}>
                  {TEST_GENDER_RULE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            小数位数
            <select value={decimalPlaces} onChange={(event) => setDecimalPlaces(event.target.value)}>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>
          <label>
            提示最小值
            <input value={minValue} onChange={(event) => setMinValue(event.target.value)} placeholder="可选" />
          </label>
          <label>
            提示最大值
            <input value={maxValue} onChange={(event) => setMaxValue(event.target.value)} placeholder="可选" />
          </label>
          <label className="dialog-span">
            备注
            <input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        {formError ? <p className="dialog-error">{formError}</p> : null}
        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
