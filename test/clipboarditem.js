import {ClipboardItem, apply, isSupported, isPolyfilled} from '../lib/clipboarditem.js'

describe('ClipboardItem', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('takes a Promise type, that can resolve', async () => {
    const c = new ClipboardItem({'text/plain': Promise.resolve('hi')})
    expect(c.types).to.eql(['text/plain'])
    expect(await c.getType('text/plain')).to.be.instanceof(Blob)
  })
})
