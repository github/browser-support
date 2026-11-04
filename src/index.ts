import * as requestIdleCallback from './requestidlecallback.js'
import * as commandAndCommandFor from 'invokers-polyfill/fn'

let supportsModalPseudo = false
try {
  // This will error in older browsers
  supportsModalPseudo = document.body.matches(':modal') === false
} catch {
  supportsModalPseudo = false
}

export const baseSupport =
  typeof globalThis === 'object' &&
  // ES2019
  'fromEntries' in Object &&
  'flatMap' in Array.prototype &&
  'trimEnd' in String.prototype &&
  // ES2020
  'allSettled' in Promise &&
  'matchAll' in String.prototype &&
  // ES2021
  'replaceAll' in String.prototype &&
  'any' in Promise &&
  // ES2022
  'at' in String.prototype &&
  'at' in Array.prototype &&
  'hasOwn' in Object &&
  // ESNext
  'abort' in AbortSignal &&
  'timeout' in AbortSignal &&
  // DOM / HTML and other specs
  typeof queueMicrotask === 'function' &&
  typeof HTMLDialogElement === 'function' &&
  supportsModalPseudo &&
  typeof AggregateError === 'function' &&
  typeof BroadcastChannel === 'function' &&
  'randomUUID' in crypto &&
  'replaceChildren' in Element.prototype &&
  'requestSubmit' in HTMLFormElement.prototype &&
  // 'requestIdleCallback' in window && // Polyfilled
  true

export const polyfills = {
  requestIdleCallback,
  commandAndCommandFor,
}

export function isSupported() {
  return baseSupport && Object.values(polyfills).every(polyfill => polyfill.isSupported())
}

export function isPolyfilled() {
  return Object.values(polyfills).every(polyfill => polyfill.isPolyfilled())
}

export function apply() {
  for (const polyfill of Object.values(polyfills)) {
    if (!polyfill.isSupported()) polyfill.apply()
  }
}
