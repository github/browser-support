export function promiseAllSettled<T extends readonly unknown[] | []>(
  values: T
): Promise<{-readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>}> {
  return Promise.all(
    values.map(p =>
      // eslint-disable-next-line github/no-then
      Promise.resolve(p).then(
        (value: unknown) => ({status: 'fulfilled', value}),
        (reason: unknown) => ({status: 'rejected', reason})
      )
    )
  ) as unknown as Promise<{-readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>}>
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'allSettled' in Promise && typeof Promise.allSettled === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Promise.all === promiseAllSettled
}

export function apply(): void {
  if (!isSupported()) {
    Promise.allSettled = promiseAllSettled
  }
}
