export async function clipboardWrite(data: ClipboardItems) {
  if (data.length === 0) return
  const item = data[0]
  const blob = await item.getType(item.types.includes('text/plain') ? 'text/plain' : item.types[0])
  return navigator.clipboard.writeText(typeof blob == 'string' ? blob : await blob.text())
}

export async function clipboardRead() {
  const str = navigator.clipboard.readText()
  return [new ClipboardItem({'text/plain': str})]
}

export function isSupported(): boolean {
  return (
    'clipboard' in navigator &&
    typeof navigator.clipboard.read === 'function' &&
    typeof navigator.clipboard.write === 'function'
  )
}

export function isPolyfilled(): boolean {
  return (
    'clipboard' in navigator &&
    (navigator.clipboard.write === clipboardWrite || navigator.clipboard.read === clipboardRead)
  )
}

export function apply(): void {
  if ('clipboard' in navigator && !isSupported()) {
    navigator.clipboard.write = clipboardWrite
    navigator.clipboard.read = clipboardRead
  }
}
