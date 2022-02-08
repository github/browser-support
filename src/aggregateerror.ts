export class AggregateError extends Error {
  declare errors: unknown[]
  declare cause: unknown

  constructor(errors: unknown[], message: string, options: {cause?: unknown} = {}) {
    super(message)
    Object.defineProperty(this, 'errors', {
      value: Array.from(errors),
      configurable: true,
      writable: true
    })
    if (options.cause) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        configurable: true,
        writable: true
      })
    }
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return typeof AggregateError === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  // @ts-expect-error `AggregateError`
  return globalThis.AggregateError === AggregateError
}

export function apply(): void {
  if (!isSupported()) {
    // @ts-expect-error `AggregateError`
    globalThis.AggregateError = AggregateError
  }
}
