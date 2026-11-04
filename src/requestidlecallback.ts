// https://w3c.github.io/requestidlecallback/#why50 caps idle deadlines at 50ms. We use a 10ms wall-clock budget per
// frame instead: this polyfill runs work right after paint, and lab data showed 10ms keeps WebKit presentation delay
// low. The budget is spent in 5ms slices, each its own task, so input, rendering, React's MessageChannel scheduler,
// timers and messages interleave with idle work instead of queueing behind one 10ms block.
const periodMs = 10
const sliceMs = 5

type Entry = {callback: IdleRequestCallback; timeout?: ReturnType<typeof setTimeout>}

const pending = new Map<number, Entry>()
let nextId = 1
let listening = false
let running = false
let periodDeadline = 0
let channel: MessageChannel | undefined
let frame: number | undefined
let task: ReturnType<typeof setTimeout> | undefined

function slice(first: boolean): void {
  const sliceEnd = Math.min(performance.now() + sliceMs, periodDeadline)
  let ran = !first
  try {
    // Each slice acts as an idle period: its callbacks share the slice deadline, and callbacks queued while it runs
    // (including self-rescheduling ones) wait for a later slice, as the spec requires. Allowing later slices in the same
    // frame matters: holding them for the next frame halved idle throughput in the lab with no INP gain.
    for (const id of [...pending.keys()]) {
      if (ran && performance.now() >= sliceEnd) break
      const entry = pending.get(id)
      if (!entry) continue
      ran = true
      pending.delete(id)
      clearTimeout(entry.timeout)
      entry.callback({didTimeout: false, timeRemaining: () => Math.max(0, sliceEnd - performance.now())})
    }
  } finally {
    if (pending.size > 0 && performance.now() < periodDeadline) {
      yieldToEventLoop()
    } else {
      running = false
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
  slice(true)
}

function post(): void {
  frame = undefined
  task = setTimeout(openPeriod, 0)
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
