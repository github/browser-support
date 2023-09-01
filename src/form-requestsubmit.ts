export function requestSubmit(
  this: HTMLFormElement,
  submitter: HTMLButtonElement | HTMLInputElement | null = null,
): void {
  const event = new SubmitEvent('submit', {bubbles: true, cancelable: true, submitter})
  let input
  if (submitter && submitter.name) {
    input = Object.assign(document.createElement('input'), {
      type: 'hidden',
      hidden: true,
      name: submitter.name,
      value: submitter.value,
    })
    this.append(input)
  }
  this.checkValidity() && !this.dispatchEvent(event) && this.submit()
  input?.remove()
}

export function isSupported(): boolean {
  return 'requestSubmit' in HTMLFormElement.prototype && typeof HTMLFormElement.prototype.requestSubmit === 'function'
}

export function isPolyfilled(): boolean {
  return HTMLFormElement.prototype.requestSubmit === requestSubmit
}

export function apply(): void {
  if (!isSupported()) {
    HTMLFormElement.prototype.requestSubmit = requestSubmit
  }
}
