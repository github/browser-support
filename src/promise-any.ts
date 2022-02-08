export function promiseAny<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>
export function promiseAny<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>
export function promiseAny<T>(ps: Iterable<T | Promise<T>>): Promise<Awaited<T>> {
  return new Promise((resolve, reject) => {
    let resolved = false
    const promises = Array.from(ps)
    const rejections: unknown[] = []
    function resolveOne(value: T) {
      if (!resolved) {
        resolved = true
        resolve(value as Awaited<T>)
      }
    }
    function rejectIfDone(e: unknown) {
      rejections.push(e)
      if (rejections.length === promises.length) {
        reject(new globalThis.AggregateError(rejections, 'All Promises rejected'))
      }
    }
    for (const p of promises) {
      // eslint-disable-next-line github/no-then
      Promise.resolve(p).then(resolveOne, rejectIfDone)
    }
  })
}

declare global {
  interface PromiseConstructor {
    any<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>
    any<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'any' in Promise && typeof Promise.any === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Promise.all === promiseAny
}

export function apply(): void {
  if (!isSupported()) {
    Promise.all = promiseAny
  }
}
