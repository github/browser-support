import * as abortSignalAbort from './abortsignal-abort.js'

const baseSupport =
  typeof Blob === 'function' &&
  typeof PerformanceObserver === 'function' &&
  typeof Intl === 'object' &&
  typeof MutationObserver === 'function' &&
  typeof URLSearchParams === 'function' &&
  typeof WebSocket === 'function' &&
  typeof IntersectionObserver === 'function' &&
  typeof queueMicrotask === 'function' &&
  typeof TextEncoder === 'function' &&
  typeof TextDecoder === 'function' &&
  typeof customElements === 'object' &&
  typeof HTMLDetailsElement === 'function' &&
  typeof AbortController === 'function' &&
  typeof AbortSignal === 'function' &&
  'entries' in FormData.prototype &&
  'toggleAttribute' in Element.prototype &&
  'replaceChildren' in Element.prototype &&
  // ES2019
  'fromEntries' in Object &&
  'flatMap' in Array.prototype &&
  'trimEnd' in String.prototype &&
  // ES2020
  'allSettled' in Promise &&
  'matchAll' in String.prototype &&
  // ES2021
  'replaceAll' in String.prototype &&
  // 'any' in Promise && // Polyfilled
  // ES2022
  // 'at' in String.prototype && // Polyfilled
  // 'at' in Array.prototype && // Polyfilled
  true

export function isSupported() {
  return baseSupport && abortSignalAbort.isSupported()
}

export function isPolyfilled() {
  return abortSignalAbort.isPolyfilled()
}

export function apply() {
  abortSignalAbort.apply()
}
