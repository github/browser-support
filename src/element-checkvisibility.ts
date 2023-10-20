declare global {
  interface Element {
    checkVisibility(options?: Partial<CheckVisibilityOptions>): boolean
  }
}

interface CheckVisibilityOptions {
  checkOpacity: boolean
  checkVisibilityCSS: boolean
}

export function checkVisibility(
  this: Element,
  {checkOpacity = false, checkVisibilityCSS = false}: Partial<CheckVisibilityOptions> = {},
) {
  if (!this.isConnected) return false
  const styles = getComputedStyle(this)
  if (styles.getPropertyValue('display') === 'contents') return false
  if (checkVisibilityCSS && styles.getPropertyValue('visibility') !== 'visible') return false
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let node: Element | null = this
  while (node) {
    const nodeStyles = node === this ? styles : getComputedStyle(node)
    if (nodeStyles.getPropertyValue('display') === 'none') return false
    if (checkOpacity && nodeStyles.getPropertyValue('opacity') === '0') return false
    if (node !== this && nodeStyles.getPropertyValue('content-visibility') === 'hidden') {
      return false
    }
    if (!node.parentElement && node.getRootNode() instanceof ShadowRoot) {
      node = (node.getRootNode() as ShadowRoot).host
    } else {
      node = node.parentElement
    }
  }
  return true
}

export function isSupported(): boolean {
  return 'checkVisibility' in Element.prototype && typeof Element.prototype.checkVisibility === 'function'
}

export function isPolyfilled(): boolean {
  return Element.prototype.checkVisibility === checkVisibility
}

export function apply(): void {
  if (!isSupported()) {
    Element.prototype.checkVisibility = checkVisibility
  }
}
