export function stringReplaceAll(
  this: string,
  searchValue: RegExp | string,
  replaceValue: ((substring: string, ...args: unknown[]) => string) | string
): string {
  if (searchValue instanceof RegExp) return this.replace(searchValue, replaceValue as unknown as string)
  let pos = -1
  let endOfLastMatch = 0
  let result = ''
  if (typeof replaceValue === 'function') {
    const unwrapped = replaceValue
    replaceValue = () => unwrapped(searchValue, pos, this)
  }
  pos = this.indexOf(searchValue, pos + 1)
  while (pos !== -1) {
    result += this.substring(endOfLastMatch, pos)
    result += searchValue.replace(searchValue, replaceValue as string)
    endOfLastMatch = pos + searchValue.length
    pos = this.indexOf(searchValue, pos + 1)
  }
  return result + this.substring(endOfLastMatch)
}

/*#__PURE__*/
export function isSupported(): boolean {
  return 'replaceAll' in String.prototype && typeof String.prototype.replaceAll === 'function'
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return String.prototype.replaceAll === stringReplaceAll
}

export function apply(): void {
  if (!isSupported()) {
    String.prototype.replaceAll = stringReplaceAll
  }
}
