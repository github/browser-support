// https://w3c.github.io/requestidlecallback/#why50 caps idle deadlines at 50ms. We use 10ms instead: this
// polyfill runs work right after paint, so it still delays the next frame's input handling, and lab data
// showed a 10ms budget keeps WebKit presentation delay low.
const maxDeadline = 10

type Handle = {
  callback: IdleRequestCallback
  frame?: number
  task?: ReturnType<typeof setTimeout>
  timeout?: ReturnType<typeof setTimeout>
}

const pending = new Map<number, Handle>()
let nextId = 1
let listening = false

function clearHandles(handle: Handle): void {
  if (handle.frame !== undefined) cancelAnimationFrame(handle.frame)
  if (handle.task !== undefined) clearTimeout(handle.task)
  if (handle.timeout !== undefined) clearTimeout(handle.timeout)
}

function run(id: number, didTimeout: boolean): void {
  const handle = pending.get(id)
  if (!handle) return
  pending.delete(id)
  clearHandles(handle)
  const start = performance.now()
  handle.callback({
    didTimeout,
    timeRemaining: () => (didTimeout ? 0 : Math.max(0, maxDeadline - (performance.now() - start))),
  })
}

function post(id: number, handle: Handle): void {
  handle.frame = undefined
  handle.task = setTimeout(() => run(id, false), 0)
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'hidden') return
  for (const [id, handle] of pending) {
    if (handle.frame !== undefined && handle.task === undefined) {
      cancelAnimationFrame(handle.frame)
      post(id, handle)
    }
  }
}

export function requestIdleCallback(callback: IdleRequestCallback, options: IdleRequestOptions = {}): number {
  // Read before registering anything so a throwing getter can't leave a callback scheduled without an id.
  // `?.` rather than relying on the default: native accepts null, which bypasses default parameters.
  const timeout = options?.timeout
  const id = nextId++
  const handle: Handle = {callback}
  pending.set(id, handle)

  const canFrame = typeof document !== 'undefined' && typeof requestAnimationFrame === 'function'
  if (canFrame && !listening) {
    listening = true
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  if (canFrame && document.visibilityState !== 'hidden') {
    handle.frame = requestAnimationFrame(() => post(id, handle))
  } else {
    post(id, handle)
  }

  if (timeout && timeout > 0) {
    handle.timeout = setTimeout(() => run(id, true), timeout)
  }
  return id
}

export function cancelIdleCallback(id: number): void {
  const handle = pending.get(id)
  if (!handle) return
  pending.delete(id)
  clearHandles(handle)
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
