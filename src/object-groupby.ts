/*#__PURE__*/
export function groupBy<K extends PropertyKey, T>(
  this: ObjectConstructor,
  items: Iterable<T>,
  keySelector: (item: T, index: number) => K,
): Partial<Record<K, T[]>> {
  const result = Object.create(null) as Partial<Record<K, T[]>>
  let index = 0
  for (const item of items) {
    const key = keySelector(item, index++)
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key]!.push(item)
    } else {
      result[key] = [item]
    }
  }
  return result
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'groupBy' in Object && typeof Object.groupBy === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return 'groupBy' in Object && Object.groupBy === groupBy
}

export function apply(): void {
  if (!isSupported()) {
    Object.assign(Object, {groupBy})
  }
}
