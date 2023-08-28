const phasOwn = Object.prototype.hasOwnProperty
export function objectHasOwn(object: unknown, property: PropertyKey) {
  if (object == null) {
    throw new TypeError('Cannot convert undefined or null to object')
  }
  return phasOwn.call(Object(object), property)
}

declare global {
  interface Object {
    hasOwn: <Key extends PropertyKey>(object: unknown, property: Key) => object is unknown & Record<Key, unknown>
  }
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'hasOwn' in Object && typeof Object.hasOwn === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return Object.hasOwn === objectHasOwn
}

export function apply(): void {
  if (!isSupported()) {
    Object.defineProperty(Object, 'hasOwn', {
      value: objectHasOwn,
      configurable: true,
      writable: true,
    })
  }
}
