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
  return (
    'abort' in AbortSignal &&
    // @ts-expect-error `.abort`
    typeof AbortSignal.abort === 'function'
  )
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  // @ts-expect-error `.abort`
  return AbortSignal.abort === abortSignalAbort
}

export function apply(): void {
  if (!isSupported()) {
    // @ts-expect-error `.abort`
    AbortSignal.abort = abortSignalAbort
  }
}
