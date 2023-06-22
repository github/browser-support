export function abortSignalAbort(reason: unknown) {
  const controller = new AbortController()
  controller.abort(reason)
  return controller.signal
}

declare global {
  interface AbortController {
    abort(reason: unknown): void
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'abort' in AbortSignal && typeof AbortSignal.abort === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return AbortSignal.abort === abortSignalAbort
}

export function apply(): void {
  if (!isSupported()) {
    AbortSignal.abort = abortSignalAbort
  }
}
