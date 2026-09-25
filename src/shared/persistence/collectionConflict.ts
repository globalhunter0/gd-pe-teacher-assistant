function fingerprint(value: unknown): string | undefined {
  return JSON.stringify(value, (_key, entry: unknown) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const object = entry as Record<string, unknown>
      return Object.fromEntries(Object.keys(object).sort().map(key => [key, object[key]]))
    }
    return entry
  })
}

/** Compare values, ignoring object property insertion order (including first-load defaults). */
export function assertCollectionUnchanged(current: unknown, expected: unknown): void {
  if (!Array.isArray(expected) || fingerprint(current) !== fingerprint(expected)) {
    throw new Error('DATA_CONFLICT：数据已更新或尚未读取，请重新加载后再保存；本次修改未写入。')
  }
}
