// Set-like interface per TC39 spec: must have has, keys, and size
interface SetLike<T> {
  has(value: T): boolean
  keys(): IterableIterator<T>
  readonly size: number
}

/*#__PURE__*/
export function union<T>(this: Set<T>, other: SetLike<T>): Set<T> {
  const result = new Set<T>(this)
  for (const value of other.keys()) {
    result.add(value)
  }
  return result
}

/*#__PURE__*/
export function intersection<T>(this: Set<T>, other: SetLike<T>): Set<T> {
  const result = new Set<T>()
  for (const value of this) {
    if (other.has(value)) {
      result.add(value)
    }
  }
  return result
}

/*#__PURE__*/
export function difference<T>(this: Set<T>, other: SetLike<T>): Set<T> {
  const result = new Set<T>()
  for (const value of this) {
    if (!other.has(value)) {
      result.add(value)
    }
  }
  return result
}

/*#__PURE__*/
export function symmetricDifference<T>(this: Set<T>, other: SetLike<T>): Set<T> {
  const result = new Set<T>(this)
  for (const value of other.keys()) {
    if (result.has(value)) {
      result.delete(value)
    } else {
      result.add(value)
    }
  }
  return result
}

/*#__PURE__*/
export function isSubsetOf<T>(this: Set<T>, other: SetLike<T>): boolean {
  if (this.size > other.size) return false
  for (const value of this) {
    if (!other.has(value)) {
      return false
    }
  }
  return true
}

/*#__PURE__*/
export function isSupersetOf<T>(this: Set<T>, other: SetLike<T>): boolean {
  for (const value of other.keys()) {
    if (!this.has(value)) {
      return false
    }
  }
  return true
}

/*#__PURE__*/
export function isDisjointFrom<T>(this: Set<T>, other: SetLike<T>): boolean {
  if (this.size <= other.size) {
    for (const value of this) {
      if (other.has(value)) {
        return false
      }
    }
  } else {
    for (const value of other.keys()) {
      if (this.has(value)) {
        return false
      }
    }
  }
  return true
}

/*#__PURE__*/
export function isSupported(): boolean {
  return (
    'union' in Set.prototype &&
    'intersection' in Set.prototype &&
    'difference' in Set.prototype &&
    'symmetricDifference' in Set.prototype &&
    'isSubsetOf' in Set.prototype &&
    'isSupersetOf' in Set.prototype &&
    'isDisjointFrom' in Set.prototype
  )
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  const proto = Set.prototype as unknown as Record<string, unknown>
  return (
    'union' in Set.prototype &&
    proto['union'] === union &&
    proto['intersection'] === intersection &&
    proto['difference'] === difference &&
    proto['symmetricDifference'] === symmetricDifference &&
    proto['isSubsetOf'] === isSubsetOf &&
    proto['isSupersetOf'] === isSupersetOf &&
    proto['isDisjointFrom'] === isDisjointFrom
  )
}

export function apply(): void {
  if (!isSupported()) {
    Object.assign(Set.prototype, {
      union,
      intersection,
      difference,
      symmetricDifference,
      isSubsetOf,
      isSupersetOf,
      isDisjointFrom,
    })
  }
}
