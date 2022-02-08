import {addEventListenerWithAbortSignal, apply, isPolyfilled, isSupported} from '../lib/event-abortsignal.js'

describe('addEventListenerWithAbortSignal', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('adds event listener, with abortable signal', async () => {
    const et = new EventTarget()
    const ac = new AbortController()
    let i = 0
    const incr = () => (i += 1)
    addEventListenerWithAbortSignal.call(et, 'test', incr, {signal: ac.signal})
    et.dispatchEvent(new Event('test'))
    et.dispatchEvent(new Event('test'))
    expect(i).to.equal(2)
    ac.abort()
    et.dispatchEvent(new Event('test'))
    expect(i).to.equal(2)
  })
})
