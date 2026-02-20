/*#__PURE__*/
export function groupBy<K, T>(
  this: MapConstructor,
  items: Iterable<T>,
  keySelector: (item: T, index: number) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>()
  let index = 0
  for (const item of items) {
    const key = keySelector(item, index++)
    if (result.has(key)) {
      result.get(key)!.push(item)
    } else {
      result.set(key, [item])
    }
  }
  return result
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'groupBy' in Map && typeof Map.groupBy === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return 'groupBy' in Map && Map.groupBy === groupBy
}

export function apply(): void {
  if (!isSupported()) {
    Object.assign(Map, {groupBy})
  }
}
