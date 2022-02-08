import {abortSignalAbort, apply, isPolyfilled, isSupported} from '../lib/abortsignal-abort.js'

describe('abortSignalAbort', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns already aborted signal', () => {
    expect(abortSignalAbort()).to.be.instanceOf(AbortSignal)
    expect(abortSignalAbort().aborted).to.equal(true)
  })

  it('creates a new signal each time', () => {
    expect(abortSignalAbort()).to.not.equal(abortSignalAbort())
  })

  it('forwards reason property', () => {
    expect(abortSignalAbort('Foo')).to.have.property('reason', 'Foo')
  })
})
