// https://w3c.github.io/requestidlecallback/#why50
// "Capping idle deadlines to 50ms means that even if the user input occurs
// immediately after the idle task has begun, the user agent still has a
// remaining 50ms in which to respond to the user input without producing user
// perceptible lag"
const maxDeadline = 50

export function requestIdleCallback(callback: IdleRequestCallback, options: IdleRequestOptions = {}): number {
  const start = Date.now()
  const timeout = options.timeout || 0
  const deadline: IdleDeadline = Object.defineProperty(
    {
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, maxDeadline - (Date.now() - start))
      },
    },
    'didTimeout',
    {
      get() {
        return Date.now() - start > timeout
      },
    },
  )
  return window.setTimeout(() => {
    callback(deadline)
  })
}

export function cancelIdleCallback(id: number): void {
  clearTimeout(id)
}

/*#__PURE__*/
export function isSupported(): boolean {
  return typeof globalThis.requestIdleCallback === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return globalThis.requestIdleCallback === requestIdleCallback && globalThis.cancelIdleCallback === cancelIdleCallback
}

export function apply(): void {
  if (!isSupported()) {
    globalThis.requestIdleCallback = requestIdleCallback
    globalThis.cancelIdleCallback = cancelIdleCallback
  }
}
