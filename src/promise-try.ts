/*#__PURE__*/
export function promiseTry<T>(this: PromiseConstructor, func: () => T | PromiseLike<T>): Promise<T> {
  return new Promise(resolve => resolve(func()))
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'try' in Promise && typeof Promise.try === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return 'try' in Promise && Promise.try === promiseTry
}

export function apply(): void {
  if (!isSupported()) {
    Object.assign(Promise, {try: promiseTry})
  }
}
