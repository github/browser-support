import * as abortSignalAbort from './abortsignal-abort.js'
import * as abortSignalTimeout from './abortsignal-timeout.js'
import * as aggregateError from './aggregateerror.js'
import * as arrayAt from './arraylike-at.js'
import * as clipboardItem from './clipboarditem.js'
import * as cryptoRandomUUID from './crypto-randomuuid.js'
import * as elementReplaceChildren from './element-replacechildren.js'
import * as eventAbortSignal from './event-abortsignal.js'
import * as navigatorClipboard from './navigator-clipboard.js'
import * as formRequestSubmit from './form-requestsubmit.js'
import * as objectHasOwn from './object-hasown.js'
import * as promiseAllSettled from './promise-allsettled.js'
import * as promiseAny from './promise-any.js'
import * as requestIdleCallback from './requestidlecallback.js'
import * as stringReplaceAll from './string-replaceall.js'

export const baseSupport =
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
  typeof globalThis === 'object' &&
  'entries' in FormData.prototype &&
  'toggleAttribute' in Element.prototype &&
  // ES2019
  'fromEntries' in Object &&
  'flatMap' in Array.prototype &&
  'trimEnd' in String.prototype &&
  // ES2020
  //'allSettled' in Promise && // Polyfilled
  'matchAll' in String.prototype &&
  // ES2021
  //'replaceAll' in String.prototype && // Polyfilled
  // 'any' in Promise && // Polyfilled
  // ES2022
  // 'at' in String.prototype && // Polyfilled
  // 'at' in Array.prototype && // Polyfilled
  // 'hasOwn' in Object && // Polyfilled
  // ESNext
  // 'abort' in AbortSignal && // Polyfilled
  // 'timeout' in AbortSignal && // Polyfilled
  // typeof AggregateError === 'function' && // Polyfilled
  // 'randomUUID' in crypto && // Polyfilled
  // 'replaceChildren' in Element.prototype && // Polyfilled
  // 'requestIdleCallback' in window && // Polyfilled
  true

export const polyfills = {
  abortSignalAbort,
  abortSignalTimeout,
  aggregateError,
  arrayAt,
  clipboardItem,
  cryptoRandomUUID,
  elementReplaceChildren,
  eventAbortSignal,
  navigatorClipboard,
  formRequestSubmit,
  objectHasOwn,
  promiseAllSettled,
  promiseAny,
  requestIdleCallback,
  stringReplaceAll
}

export function isSupported() {
  return baseSupport && Object.values(polyfills).every(polyfill => polyfill.isSupported())
}

export function isPolyfilled() {
  return Object.values(polyfills).every(polyfill => polyfill.isPolyfilled())
}

export function apply() {
  for (const polyfill of Object.values(polyfills)) {
    polyfill.apply()
  }
}
