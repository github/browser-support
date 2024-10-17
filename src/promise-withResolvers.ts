/*#__PURE__*/
export function withResolvers<T>(this: PromiseConstructor) {
  const out = {} as {
    promise: Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void
  }
  out.promise = new Promise<T>((resolve, reject) => {
    out.resolve = resolve
    out.reject = reject
  })
  return out
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'withResolvers' in Promise && typeof Promise.withResolvers === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return 'withResolvers' in Promise && Promise.withResolvers === withResolvers
}

export function apply(): void {
  if (!isSupported()) {
    Object.assign(Promise, {withResolvers})
  }
}
