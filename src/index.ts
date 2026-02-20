import * as clipboardItem from './clipboarditem.js'
import * as elementCheckVisibility from './element-checkvisibility.js'
import * as navigatorClipboard from './navigator-clipboard.js'
import * as withResolvers from './promise-withResolvers.js'
import * as requestIdleCallback from './requestidlecallback.js'
import * as popover from '@oddbird/popover-polyfill/fn'
import * as commandAndCommandFor from 'invokers-polyfill/fn'
import * as objectGroupBy from './object-groupby.js'
import * as mapGroupBy from './map-groupby.js'
import * as promiseTry from './promise-try.js'
import * as iteratorHelpers from './iterator-helpers.js'

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
  clipboardItem,
  elementCheckVisibility,
  navigatorClipboard,
  requestIdleCallback,
  withResolvers,
  popover,
  commandAndCommandFor,
  objectGroupBy,
  mapGroupBy,
  promiseTry,
  iteratorHelpers,
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
