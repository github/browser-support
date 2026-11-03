// https://w3c.github.io/requestidlecallback/#why50 caps idle deadlines at 50ms. We use 10ms instead: this
// polyfill runs work right after paint, so it still delays the next frame's input handling. As in the spec,
// all callbacks in one idle period share a single deadline, so a burst of callbacks can't stack up 10ms each
// in one frame. Lab data showed a 10ms budget keeps WebKit presentation delay low.
const maxDeadline = 10

type Entry = {callback: IdleRequestCallback; timeout?: ReturnType<typeof setTimeout>}

const pending = new Map<number, Entry>()
let nextId = 1
let listening = false
let running = false
let frame: number | undefined
let task: ReturnType<typeof setTimeout> | undefined

function runPeriod(): void {
  task = undefined
  running = true
  const deadline = performance.now() + maxDeadline
  let ran = false
  try {
    // Snapshot so callbacks queued during this period wait for the next one.
    for (const id of [...pending.keys()]) {
      if (ran && performance.now() >= deadline) break
      const entry = pending.get(id)
      if (!entry) continue
      ran = true
      pending.delete(id)
      clearTimeout(entry.timeout)
      entry.callback({didTimeout: false, timeRemaining: () => Math.max(0, deadline - performance.now())})
    }
  } finally {
    running = false
    if (pending.size > 0) schedule()
  }
}

function post(): void {
  frame = undefined
  task = setTimeout(runPeriod, 0)
}

function schedule(): void {
  if (running || frame !== undefined || task !== undefined) return
  if (typeof document !== 'undefined' && typeof requestAnimationFrame === 'function') {
    if (!listening) {
      listening = true
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    if (document.visibilityState !== 'hidden') {
      frame = requestAnimationFrame(post)
      return
    }
  }
  post()
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'hidden' || frame === undefined) return
  cancelAnimationFrame(frame)
  post()
}

export function requestIdleCallback(callback: IdleRequestCallback, options: IdleRequestOptions = {}): number {
  // Read before registering anything so a throwing getter can't leave a callback scheduled without an id.
  // `?.` rather than relying on the default: native accepts null, which bypasses default parameters.
  const timeout = options?.timeout
  const id = nextId++
  const entry: Entry = {callback}
  pending.set(id, entry)
  if (timeout && timeout > 0) {
    entry.timeout = setTimeout(() => {
      if (pending.get(id) !== entry) return
      pending.delete(id)
      callback({didTimeout: true, timeRemaining: () => 0})
    }, timeout)
  }
  schedule()
  return id
}

export function cancelIdleCallback(id: number): void {
  const entry = pending.get(id)
  if (!entry) return
  pending.delete(id)
  clearTimeout(entry.timeout)
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
