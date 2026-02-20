// Get the Iterator prototype
/*#__PURE__*/
function getIteratorPrototype(): Iterator<unknown> | null {
  try {
    // Try to get Iterator prototype from a generator
    const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor
    const generator = new GeneratorFunction('return (function*(){})();')()
    return Object.getPrototypeOf(Object.getPrototypeOf(generator))
  } catch {
    return null
  }
}

/*#__PURE__*/
function map<T, U>(this: Iterator<T>, mapper: (value: T, index: number) => U): Iterator<U> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  return {
    next() {
      const result = iterator.next()
      if (result.done) {
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
      }
      return {done: false, value: mapper(result.value, index++)}
    },
    return(value?: U) {
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value} as IteratorReturnResult<U>
    },
  } as Iterator<U>
}

/*#__PURE__*/
function filter<T>(this: Iterator<T>, predicate: (value: T, index: number) => boolean): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  return {
    next() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = iterator.next()
        if (result.done) {
          return {done: true, value: undefined} as IteratorReturnResult<undefined>
        }
        if (predicate(result.value, index++)) {
          return result
        }
      }
    },
    return(value?: T) {
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value} as IteratorReturnResult<T>
    },
  } as Iterator<T>
}

/*#__PURE__*/
function take<T>(this: Iterator<T>, limit: number): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let remaining = limit
  return {
    next() {
      if (remaining <= 0) {
        if (iterator.return) {
          iterator.return()
        }
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
      }
      remaining--
      return iterator.next()
    },
    return(value?: T) {
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value} as IteratorReturnResult<T>
    },
  } as Iterator<T>
}

/*#__PURE__*/
function drop<T>(this: Iterator<T>, limit: number): Iterator<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let remaining = limit
  return {
    next() {
      while (remaining > 0) {
        const result = iterator.next()
        if (result.done) {
          return {done: true, value: undefined} as IteratorReturnResult<undefined>
        }
        remaining--
      }
      return iterator.next()
    },
    return(value?: T) {
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value} as IteratorReturnResult<T>
    },
  } as Iterator<T>
}

/*#__PURE__*/
function flatMap<T, U>(this: Iterator<T>, mapper: (value: T, index: number) => Iterable<U> | Iterator<U>): Iterator<U> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  let innerIterator: Iterator<U> | null = null

  return {
    next() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (innerIterator) {
          const result = innerIterator.next()
          if (!result.done) {
            return result
          }
          innerIterator = null
        }

        const result = iterator.next()
        if (result.done) {
          return {done: true, value: undefined} as IteratorReturnResult<undefined>
        }

        const mapped = mapper(result.value, index++)
        innerIterator = Symbol.iterator in mapped ? mapped[Symbol.iterator]() : (mapped as Iterator<U>)
      }
    },
    return(value?: U) {
      if (innerIterator?.return) {
        innerIterator.return()
      }
      if (iterator.return) {
        iterator.return()
      }
      return {done: true, value} as IteratorReturnResult<U>
    },
  } as Iterator<U>
}

/*#__PURE__*/
function reduce<T>(this: Iterator<T>, reducer: (accumulator: T, value: T, index: number) => T): T
/*#__PURE__*/
function reduce<T, U>(this: Iterator<T>, reducer: (accumulator: U, value: T, index: number) => U, initialValue: U): U
/*#__PURE__*/
function reduce<T, U>(this: Iterator<T>, reducer: (accumulator: U, value: T, index: number) => U, initialValue?: U): U {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const iterator = this
  let index = 0
  let accumulator: U

  if (arguments.length < 2) {
    const result = iterator.next()
    if (result.done) {
      throw new TypeError('Reduce of empty iterator with no initial value')
    }
    accumulator = result.value as unknown as U
    index = 1
  } else {
    accumulator = initialValue!
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
  if (typeof obj === 'object' && obj !== null) {
    if ('next' in obj && typeof obj.next === 'function') {
      return obj as Iterator<T>
    }
    if (Symbol.iterator in obj) {
      return obj[Symbol.iterator]()
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
    typeof IteratorConstructor === 'object' &&
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
    IteratorConstructor !== undefined &&
    'from' in IteratorConstructor &&
    IteratorConstructor.from === iteratorFrom
  )
}

export function apply(): void {
  if (isSupported()) return

  const IteratorPrototype = getIteratorPrototype()
  if (IteratorPrototype) {
    if (!('map' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {map})
    }
    if (!('filter' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {filter})
    }
    if (!('take' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {take})
    }
    if (!('drop' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {drop})
    }
    if (!('flatMap' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {flatMap})
    }
    if (!('reduce' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {reduce})
    }
    if (!('toArray' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {toArray})
    }
    if (!('forEach' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {forEach})
    }
    if (!('some' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {some})
    }
    if (!('every' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {every})
    }
    if (!('find' in IteratorPrototype)) {
      Object.assign(IteratorPrototype, {find})
    }
  }

  const IteratorConstructor = (globalThis as typeof globalThis & {Iterator?: {from?: unknown}}).Iterator
  if (IteratorConstructor && !('from' in IteratorConstructor)) {
    Object.assign(IteratorConstructor, {from: iteratorFrom})
  }
}
