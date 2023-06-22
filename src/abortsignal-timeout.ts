export function abortSignalTimeout(ms: number) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(new DOMException('TimeoutError')), ms)
  return controller.signal
}

declare global {
  interface AbortController {
    abort(reason: unknown): void
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'abort' in AbortSignal && typeof AbortSignal.timeout === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return AbortSignal.timeout === abortSignalTimeout
}

export function apply(): void {
  if (!isSupported()) {
    AbortSignal.timeout = abortSignalTimeout
  }
}
