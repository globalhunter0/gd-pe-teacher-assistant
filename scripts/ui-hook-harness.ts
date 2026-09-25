// Deterministic hook adapter: executes production component handlers/effects without a DOM.
// This verifies state transitions, not browser layout or React scheduling internals.
let slots: any[] = []
let cursor = 0
let effects: Array<() => unknown> = []
export const contexts: Record<string, any> = {}
export function resetHooks() { slots = []; cursor = 0; effects = [] }
export function render(component: any, props: any) {
  cursor = 0
  const result = component(props)
  const pending = effects; effects = []
  for (const effect of pending) effect()
  return result
}
export function useState(initial: any) {
  const index = cursor++
  if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
  return [slots[index], (value: any) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
}
export function useRef(value: any) {
  const index = cursor++
  if (!(index in slots)) slots[index] = { current: value }
  return slots[index]
}
export const useMemo = (fn: any) => fn()
export const useCallback = (fn: any) => fn
export function useEffect(fn: any, dependencies: any[]) {
  const index = cursor++, previous = slots[index]
  if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
    slots[index] = dependencies
    effects.push(fn)
  }
}
export const jsx = (type: any, props: any) => ({ type, props })
export const jsxs = jsx
export const Fragment = 'fragment'
export function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [...(tree.type ? [tree] : []), ...Object.values(tree.props ?? tree).flatMap(nodes)]
}
export function textOf(tree: any): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree)
  if (!tree || typeof tree !== 'object') return ''
  if (Array.isArray(tree)) return tree.map(textOf).join(' ')
  return Object.values(tree.props ?? tree).map(textOf).join(' ')
}
