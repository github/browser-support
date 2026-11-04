// https://w3c.github.io/requestidlecallback/#why50 caps idle deadlines at 50ms. We use a 10ms wall-clock budget per
// frame instead: this polyfill runs work right after paint, and lab data showed 10ms keeps WebKit presentation delay
// low. Each callback runs in its own task, with at most 5ms of that budget, so input, rendering, React's
// MessageChannel scheduler, timers and messages interleave with idle work instead of queueing behind one 10ms block,
// and promise continuations settle between callbacks as they do with native requestIdleCallback.
// Like native, requests made while a period is running wait for the next period. A cheap self-rescheduling poller
// would otherwise run thousands of times a second in one period and hold a core. The exception is a request made
// synchronously by a callback that used its whole slice: that is a work loop continuing, and may run later in the
// same period.
const periodMs = 10
const sliceMs = 5
// rAF can stop firing while the document still reports `visible` (for example in a display:none cross-origin
// iframe), so a frame that doesn't arrive in time is replaced by a task.
const frameFallbackMs = 250
// With no frames to pace periods (hidden tab), only a timer separates them. Real Safari showed back-to-back 10ms
// periods using more than half a core for a self-rescheduling queue, so hidden periods are spaced out.
const hiddenGapMs = 100

type Entry = {callback: IdleRequestCallback; timeout?: ReturnType<typeof setTimeout>}

const pending = new Map<number, Entry>()
// Requests that must wait for the next period: ones made after the frame gate fired but before its period opens
// (not painted yet), and ones made while a period is running, unless the requesting callback used its whole slice.
const deferred = new Set<number>()
// Ids requested synchronously by the idle callback that is running right now, undefined outside of one.
let requestedByCallback: Set<number> | undefined
let nextId = 1
let listening = false
let running = false
let periodDeadline = 0
let channel: MessageChannel | undefined
let frame: number | undefined
let frameFallback: ReturnType<typeof setTimeout> | undefined
let task: ReturnType<typeof setTimeout> | undefined

function remove(id: number): void {
  pending.delete(id)
  deferred.delete(id)
}

function slice(first: boolean): void {
  const now = performance.now()
  const sliceEnd = Math.min(now + sliceMs, periodDeadline)
  try {
    if (first || now < periodDeadline) {
      // Callbacks queued before the period opened run in later tasks of it, bounded by the wall deadline. Requests
      // made by a callback that returned with time left in its slice are deferred below, as the spec says. Ones from
      // a callback that used its whole slice stay eligible, so a work loop that requeues itself keeps its throughput.
      for (const [id, entry] of pending) {
        if (deferred.has(id)) continue
        remove(id)
        clearTimeout(entry.timeout)
        const {callback} = entry
        const requested = new Set<number>()
        requestedByCallback = requested
        try {
          callback({didTimeout: false, timeRemaining: () => Math.max(0, sliceEnd - performance.now())})
        } finally {
          requestedByCallback = undefined
          if (performance.now() < sliceEnd) {
            for (const requestedId of requested) {
              if (pending.has(requestedId)) deferred.add(requestedId)
            }
          }
        }
        break
      }
    }
  } finally {
    if (pending.size > deferred.size && performance.now() < periodDeadline) {
      yieldToEventLoop()
    } else {
      running = false
      deferred.clear()
      if (pending.size > 0) schedule()
    }
  }
}

function nextSlice(): void {
  slice(false)
}

function yieldToEventLoop(): void {
  if (typeof MessageChannel === 'undefined') {
    setTimeout(nextSlice, 0)
    return
  }
  if (!channel) {
    channel = new MessageChannel()
    channel.port1.onmessage = nextSlice
  }
  channel.port2.postMessage(null)
}

function openPeriod(): void {
  task = undefined
  running = true
  periodDeadline = performance.now() + periodMs
  // Nothing was painted while hidden, so there is no paint gate left to honor.
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') deferred.clear()
  slice(true)
}

function post(delay = 0): void {
  if (frame !== undefined) cancelAnimationFrame(frame)
  clearTimeout(frameFallback)
  frame = undefined
  frameFallback = undefined
  task = setTimeout(openPeriod, delay)
}

function schedule(): void {
  if (running || frame !== undefined || task !== undefined) return
  if (typeof document !== 'undefined' && typeof requestAnimationFrame === 'function') {
    if (!listening) {
      listening = true
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    if (document.visibilityState !== 'hidden') {
      // A stale frame or fallback must not open a second period once the gate has moved on.
      const gate = requestAnimationFrame(() => {
        if (frame === gate) post()
      })
      frame = gate
      frameFallback = setTimeout(() => {
        if (frame === gate) post()
      }, frameFallbackMs)
      return
    }
    post(hiddenGapMs)
    return
  }
  post()
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden' && frame !== undefined) post()
}

export function requestIdleCallback(callback: IdleRequestCallback, options: IdleRequestOptions = {}): number {
  // Convert before registering anything so a throwing getter or value can't leave a callback scheduled without an
  // id. `?.` rather than relying on the default: native accepts null, which bypasses default parameters.
  const timeout = options?.timeout
  const delay = timeout && timeout > 0 ? timeout : 0
  const id = nextId++
  const entry: Entry = {callback}
  pending.set(id, entry)
  if (task !== undefined) deferred.add(id)
  else if (requestedByCallback) requestedByCallback.add(id)
  else if (running) deferred.add(id)
  if (delay > 0) {
    entry.timeout = setTimeout(() => {
      if (pending.get(id) !== entry) return
      remove(id)
      callback({didTimeout: true, timeRemaining: () => 0})
    }, delay)
  }
  schedule()
  return id
}

export function cancelIdleCallback(id: number): void {
  const entry = pending.get(id)
  if (!entry) return
  remove(id)
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
