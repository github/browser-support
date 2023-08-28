const originalAddEventListener = EventTarget.prototype.addEventListener
export function addEventListenerWithAbortSignal(
  this: EventTarget,
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof options === 'object' && 'signal' in options && options.signal instanceof AbortSignal) {
    if (options.signal.aborted) return
    originalAddEventListener.call(options.signal, 'abort', () => {
      this.removeEventListener(type, callback, options)
    })
  }
  return originalAddEventListener.call(this, type, callback, options)
}

declare global {
  interface AddEventListenerOptions {
    signal?: AbortSignal
  }
}

export function isSupported(): boolean {
  let signalSupported = false
  const setSignalSupported = () => (signalSupported = true)

  function noop() {}
  const options = Object.create({}, {signal: {get: setSignalSupported}})
  try {
    const target = new EventTarget()
    target.addEventListener('test', noop, options)
    target.removeEventListener('test', noop, options)
    return signalSupported
  } catch {
    return signalSupported
  }
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return EventTarget.prototype.addEventListener === addEventListenerWithAbortSignal
}

export function apply(): void {
  if (typeof AbortSignal === 'function' && !isSupported()) {
    EventTarget.prototype.addEventListener = addEventListenerWithAbortSignal
  }
}
