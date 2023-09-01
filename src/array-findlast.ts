export function arrayFindLast<T>(
  this: T[],
  pred: (this: T[], value: T, i: number, array: T[]) => boolean,
  recv = this,
): T | void {
  for (let i = this.length - 1; i >= 0; i -= 1) {
    if (pred.call(recv, this[i], i, this)) return this[i]
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'findLast' in Array.prototype && typeof Array.prototype.findLast === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Array.prototype.findLast === arrayFindLast
}

export function apply(): void {
  if (!isSupported()) {
    const defn = {value: arrayFindLast, writable: true, configurable: true}
    Object.defineProperty(Array.prototype, 'findLast', defn)
  }
}
