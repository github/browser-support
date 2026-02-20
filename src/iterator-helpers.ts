// Get the Iterator prototype
/*#__PURE__*/
function getIteratorPrototype(): Iterator<unknown> | null {
  try {
    // Derive IteratorPrototype from the Array iterator prototype chain.
    // This avoids dynamic evaluation and works under strict CSP.
    if (typeof Symbol !== 'function' || typeof Symbol.iterator !== 'symbol') {
      return null
    }
    const arrayIter = [][Symbol.iterator]()
    const arrayIterProto = Object.getPrototypeOf(arrayIter)
    if (!arrayIterProto) return null
    return Object.getPrototypeOf(arrayIterProto) as Iterator<unknown> | null
  } catch {
    return null
  }
}

// Fallback prototype used when native IteratorPrototype cannot be discovered.
// Helper-produced iterators inherit from this so that method chaining still
// works even in environments where getIteratorPrototype() returns null.
const helperPrototype: Record<string, unknown> = {}

/*#__PURE__*/
function map<T, U>(this: Iterator<T>, mapper: (value: T, index: number) => U): Iterator<U> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  const iteratorPrototype = getIteratorPrototype()
  const result = Object.create(iteratorPrototype || helperPrototype) as Iterator<U>
  result.next = function () {
    const res = iterator.next()
    if (res.done) {
      return {done: true, value: undefined} as IteratorReturnResult<undefined>
    }
    return {done: false, value: mapper(res.value, index++)}
  }
  result.return = function (value?: U) {
    if (iterator.return) {
      iterator.return()
    }
    return {done: true, value} as IteratorReturnResult<U>
  }
  return result
}

/*#__PURE__*/
function filter<T>(this: Iterator<T>, predicate: (value: T, index: number) => boolean): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  const iteratorPrototype = getIteratorPrototype()
  const result = Object.create(iteratorPrototype || helperPrototype) as Iterator<T>
  result.next = function () {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = iterator.next()
      if (res.done) {
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
      }
      if (predicate(res.value, index++)) {
        return res
      }
    }
  }
  result.return = function (value?: T) {
    if (iterator.return) {
      iterator.return()
    }
    return {done: true, value} as IteratorReturnResult<T>
  }
  return result
}

/*#__PURE__*/
function take<T>(this: Iterator<T>, limit: number): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let remaining = limit
  const iteratorPrototype = getIteratorPrototype()
  const result = Object.create(iteratorPrototype || helperPrototype) as Iterator<T>
  result.next = function () {
    if (remaining <= 0) {
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value: undefined} as IteratorReturnResult<undefined>
    }
    remaining--
    return iterator.next()
  }
  result.return = function (value?: T) {
    if (iterator.return) {
      iterator.return()
    }
    return {done: true, value} as IteratorReturnResult<T>
  }
  return result
}

/*#__PURE__*/
function drop<T>(this: Iterator<T>, limit: number): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let remaining = limit
  const iteratorPrototype = getIteratorPrototype()
  const result = Object.create(iteratorPrototype || helperPrototype) as Iterator<T>
  result.next = function () {
    while (remaining > 0) {
      const res = iterator.next()
      if (res.done) {
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
      }
      remaining--
    }
    return iterator.next()
  }
  result.return = function (value?: T) {
    if (iterator.return) {
      iterator.return()
    }
    return {done: true, value} as IteratorReturnResult<T>
  }
  return result
}

/*#__PURE__*/
function flatMap<T, U>(this: Iterator<T>, mapper: (value: T, index: number) => Iterable<U> | Iterator<U>): Iterator<U> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  let innerIterator: Iterator<U> | null = null
  const iteratorPrototype = getIteratorPrototype()
  const result = Object.create(iteratorPrototype || helperPrototype) as Iterator<U>
  result.next = function () {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (innerIterator) {
        const res = innerIterator.next()
        if (!res.done) {
          return res
        }
        innerIterator = null
      }

      const res = iterator.next()
      if (res.done) {
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
      }

      const mapped = mapper(res.value, index++)
      innerIterator = Symbol.iterator in mapped ? mapped[Symbol.iterator]() : (mapped as Iterator<U>)
    }
  }
  result.return = function (value?: U) {
    if (innerIterator?.return) {
      innerIterator.return()
    }
    if (iterator.return) {
      iterator.return()
    }
    return {done: true, value} as IteratorReturnResult<U>
  }
  return result
}

/*#__PURE__*/
function reduce<T>(this: Iterator<T>, reducer: (accumulator: T, value: T, index: number) => T): T
/*#__PURE__*/
function reduce<T, U>(this: Iterator<T>, reducer: (accumulator: U, value: T, index: number) => U, initialValue: U): U
/*#__PURE__*/
function reduce<T, U>(
  this: Iterator<T>,
  reducer: (accumulator: U, value: T, index: number) => U,
  ...rest: [initialValue: U] | []
): U {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  let accumulator: U

  // Use rest.length to reliably detect whether an initialValue was provided,
  // including the case where undefined is intentionally passed as initialValue.
  if (rest.length === 0) {
    const result = iterator.next()
    if (result.done) {
      throw new TypeError('Reduce of empty iterator with no initial value')
    }
    accumulator = result.value as unknown as U
    index = 1
  } else {
    accumulator = rest[0]
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = iterator.next()
    if (result.done) {
      return accumulator
    }
    accumulator = reducer(accumulator, result.value, index++)
  }
}

/*#__PURE__*/
function toArray<T>(this: Iterator<T>): T[] {
  const result: T[] = []
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const next = this.next()
    if (next.done) {
      return result
    }
    result.push(next.value)
  }
}

/*#__PURE__*/
function forEach<T>(this: Iterator<T>, callback: (value: T, index: number) => void): void {
  let index = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = this.next()
    if (result.done) {
      return
    }
    callback(result.value, index++)
  }
}

/*#__PURE__*/
function some<T>(this: Iterator<T>, predicate: (value: T, index: number) => boolean): boolean {
  let index = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = this.next()
    if (result.done) {
      return false
    }
    if (predicate(result.value, index++)) {
      if (this.return) {
        this.return()
      }
      return true
    }
  }
}

/*#__PURE__*/
function every<T>(this: Iterator<T>, predicate: (value: T, index: number) => boolean): boolean {
  let index = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = this.next()
    if (result.done) {
      return true
    }
    if (!predicate(result.value, index++)) {
      if (this.return) {
        this.return()
      }
      return false
    }
  }
}

/*#__PURE__*/
function find<T>(this: Iterator<T>, predicate: (value: T, index: number) => boolean): T | undefined {
  let index = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = this.next()
    if (result.done) {
      return undefined
    }
    if (predicate(result.value, index++)) {
      if (this.return) {
        this.return()
      }
      return result.value
    }
  }
}

/*#__PURE__*/
function iteratorFrom<T>(obj: Iterator<T> | Iterable<T>): Iterator<T> {
  if (obj != null) {
    // Check for iterator (an object with a .next method)
    if (typeof obj === 'object' && 'next' in obj && typeof (obj as Iterator<T>).next === 'function') {
      return obj as Iterator<T>
    }
    // Box primitives (e.g. strings) so we can check Symbol.iterator on them
    const iterable = Object(obj) as {[Symbol.iterator]?: () => Iterator<T>}
    if (Symbol.iterator in iterable && typeof iterable[Symbol.iterator] === 'function') {
      return iterable[Symbol.iterator]!()
    }
  }
  throw new TypeError('Object is not an iterator or iterable')
}

/*#__PURE__*/
export function isSupported(): boolean {
  const IteratorPrototype = getIteratorPrototype()
  const IteratorConstructor = (globalThis as typeof globalThis & {Iterator?: {from?: unknown}}).Iterator
  return (
    IteratorPrototype !== null &&
    'map' in IteratorPrototype &&
    'filter' in IteratorPrototype &&
    'take' in IteratorPrototype &&
    'drop' in IteratorPrototype &&
    'flatMap' in IteratorPrototype &&
    'reduce' in IteratorPrototype &&
    'toArray' in IteratorPrototype &&
    'forEach' in IteratorPrototype &&
    'some' in IteratorPrototype &&
    'every' in IteratorPrototype &&
    'find' in IteratorPrototype &&
    IteratorConstructor !== undefined &&
    (typeof IteratorConstructor === 'object' || typeof IteratorConstructor === 'function') &&
    IteratorConstructor !== null &&
    'from' in IteratorConstructor
  )
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  const IteratorPrototype = getIteratorPrototype()
  const IteratorConstructor = (globalThis as typeof globalThis & {Iterator?: {from?: unknown}}).Iterator
  return (
    IteratorPrototype !== null &&
    'map' in IteratorPrototype &&
    IteratorPrototype.map === map &&
    'filter' in IteratorPrototype &&
    IteratorPrototype.filter === filter &&
    'take' in IteratorPrototype &&
    IteratorPrototype.take === take &&
    'drop' in IteratorPrototype &&
    IteratorPrototype.drop === drop &&
    'flatMap' in IteratorPrototype &&
    IteratorPrototype.flatMap === flatMap &&
    'reduce' in IteratorPrototype &&
    IteratorPrototype.reduce === reduce &&
    'toArray' in IteratorPrototype &&
    IteratorPrototype.toArray === toArray &&
    'forEach' in IteratorPrototype &&
    IteratorPrototype.forEach === forEach &&
    'some' in IteratorPrototype &&
    IteratorPrototype.some === some &&
    'every' in IteratorPrototype &&
    IteratorPrototype.every === every &&
    'find' in IteratorPrototype &&
    IteratorPrototype.find === find &&
    IteratorConstructor !== undefined &&
    'from' in IteratorConstructor &&
    IteratorConstructor.from === iteratorFrom
  )
}

export function apply(): void {
  if (isSupported()) return

  const IteratorPrototype = getIteratorPrototype()
  // Install methods on the native IteratorPrototype when available, falling
  // back to helperPrototype so that iterators produced by helpers can still
  // chain even when the native prototype cannot be discovered.
  const targetPrototype = (IteratorPrototype || helperPrototype) as Record<string, unknown>

  if (!('map' in targetPrototype)) {
    Object.assign(targetPrototype, {map})
  }
  if (!('filter' in targetPrototype)) {
    Object.assign(targetPrototype, {filter})
  }
  if (!('take' in targetPrototype)) {
    Object.assign(targetPrototype, {take})
  }
  if (!('drop' in targetPrototype)) {
    Object.assign(targetPrototype, {drop})
  }
  if (!('flatMap' in targetPrototype)) {
    Object.assign(targetPrototype, {flatMap})
  }
  if (!('reduce' in targetPrototype)) {
    Object.assign(targetPrototype, {reduce})
  }
  if (!('toArray' in targetPrototype)) {
    Object.assign(targetPrototype, {toArray})
  }
  if (!('forEach' in targetPrototype)) {
    Object.assign(targetPrototype, {forEach})
  }
  if (!('some' in targetPrototype)) {
    Object.assign(targetPrototype, {some})
  }
  if (!('every' in targetPrototype)) {
    Object.assign(targetPrototype, {every})
  }
  if (!('find' in targetPrototype)) {
    Object.assign(targetPrototype, {find})
  }

  let IteratorConstructor = (globalThis as typeof globalThis & {Iterator?: {from?: unknown}}).Iterator
  if (!IteratorConstructor) {
    ;(globalThis as typeof globalThis & {Iterator?: unknown}).Iterator = {}
    IteratorConstructor = (globalThis as typeof globalThis & {Iterator?: {from?: unknown}}).Iterator
  }
  if (IteratorConstructor && !('from' in IteratorConstructor)) {
    Object.assign(IteratorConstructor, {from: iteratorFrom})
  }
}
