const records = new WeakMap<ClipboardItem, Record<string, ClipboardItemDataType | PromiseLike<ClipboardItemDataType>>>()
const presentationStyles = new WeakMap<ClipboardItem, PresentationStyle>()
export class ClipboardItem {
  constructor(
    items: Record<string, ClipboardItemDataType | PromiseLike<ClipboardItemDataType>>,
    options: ClipboardItemOptions | undefined = {}
  ) {
    if (Object.keys(items).length === 0) throw new TypeError('Empty dictionary argument')
    records.set(this, items)
    presentationStyles.set(this, options.presentationStyle || 'unspecified')
  }

  get presentationStyle(): PresentationStyle {
    return presentationStyles.get(this) || 'unspecified'
  }

  get types() {
    return Object.freeze(Object.keys(records.get(this) || {}))
  }

  async getType(type: string): Promise<Blob> {
    const record = records.get(this)
    if (record && type in record) {
      const item = await record[type]!
      if (typeof item === 'string') return new Blob([item], {type})
      return item
    }
    throw new DOMException("Failed to execute 'getType' on 'ClipboardItem': The type was not found", 'NotFoundError')
  }
}

export function isSupported(): boolean {
  try {
    new globalThis.ClipboardItem({'text/plain': Promise.resolve('')})
    return true
  } catch {
    return false
  }
}

export function isPolyfilled(): boolean {
  return globalThis.ClipboardItem === ClipboardItem
}

export function apply(): void {
  if (!isSupported()) {
    globalThis.ClipboardItem = ClipboardItem
  }
}
