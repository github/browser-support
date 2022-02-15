export function replaceChildren(this: Element | Document | DocumentFragment, ...children: Node[]) {
  while (this.firstChild) this.removeChild(this.firstChild)
  this.append(...children)
}

/*#__PURE__*/
export function isSupported(): boolean {
  return (
    'replaceChildren' in Element.prototype &&
    typeof Element.prototype.replaceChildren === 'function' &&
    'replaceChildren' in Document.prototype &&
    typeof Document.prototype.replaceChildren === 'function' &&
    'replaceChildren' in DocumentFragment.prototype &&
    typeof DocumentFragment.prototype.replaceChildren === 'function'
  )
}

/*#__PURE__*/
export function isPolyfilled(): boolean {
  return (
    Element.prototype.replaceChildren === replaceChildren &&
    Document.prototype.replaceChildren === replaceChildren &&
    DocumentFragment.prototype.replaceChildren === replaceChildren
  )
}

export function apply(): void {
  if (!isSupported()) {
    Element.prototype.replaceChildren =
      Document.prototype.replaceChildren =
      DocumentFragment.prototype.replaceChildren =
        replaceChildren
  }
}
