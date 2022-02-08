export function randomUUID() {
  const buf = new Uint32Array(4)
  crypto.getRandomValues(buf)
  let idx = -1
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    idx++
    const r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

declare global {
  interface Crypto {
    randomUUID(): string
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return typeof crypto === 'object' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return isSupported() && crypto.randomUUID === randomUUID
}

export function apply(): void {
  if (!isSupported()) {
    crypto.randomUUID = randomUUID
  }
}
