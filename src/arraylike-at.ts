const TypedArrayProto: {at?: typeof arrayLikeAt} = Reflect.getPrototypeOf(Int8Array) || {}

export function arrayLikeAt<T>(this: ArrayLike<T>, i: number): T | void {
  const l = this.length
  i = Math.trunc(i) || 0
  if (i < 0) i += l
  return i < 0 || i >= l ? undefined : this[i]
}

/*#__PURE__*/
export function isSupported(): boolean {
  return (
    'at' in Array.prototype &&
    typeof Array.prototype.at === 'function' &&
    'at' in String.prototype &&
    typeof String.prototype.at === 'function' &&
    'at' in TypedArrayProto &&
    typeof TypedArrayProto.at === 'function'
  )
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Array.prototype.at === arrayLikeAt && String.prototype.at === arrayLikeAt && TypedArrayProto.at === arrayLikeAt
}

export function apply(): void {
  if (!isSupported()) {
    const defn = {value: arrayLikeAt, writable: true, configurable: true}
    Object.defineProperty(Array.prototype, 'at', defn)
    Object.defineProperty(String.prototype, 'at', defn)
    Object.defineProperty(TypedArrayProto, 'at', defn)
  }
}
