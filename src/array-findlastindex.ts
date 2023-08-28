export function arrayFindLastIndex<T>(
  this: T[],
  pred: (this: T[], value: T, i: number, array: T[]) => boolean,
  recv = this,
): number {
  for (let i = this.length - 1; i >= 0; i -= 1) {
    if (pred.call(recv, this[i], i, this)) return i
  }
  return -1
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'findLastIndex' in Array.prototype && typeof Array.prototype.findLastIndex === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Array.prototype.findLastIndex === arrayFindLastIndex
}

export function apply(): void {
  if (!isSupported()) {
    const defn = {
      value: arrayFindLastIndex,
      writable: true,
      configurable: true,
    }
    Object.defineProperty(Array.prototype, 'findLastIndex', defn)
  }
}
