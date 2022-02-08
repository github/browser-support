import {abortSignalTimeout, apply, isPolyfilled, isSupported} from '../lib/abortsignal-timeout.js'

describe('abortSignalTimeout', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns signal that will timeout', async () => {
    expect(abortSignalTimeout()).to.be.instanceOf(AbortSignal)
    const signal = abortSignalTimeout(0)
    const longerSignal = abortSignalTimeout(20)
    expect(signal.aborted).to.equal(false)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(signal.aborted).to.equal(true)
    expect(longerSignal.aborted).to.equal(false)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(longerSignal.aborted).to.equal(true)
  })

  it('creates a new signal each time', () => {
    expect(abortSignalTimeout()).to.not.equal(abortSignalTimeout())
  })
})
