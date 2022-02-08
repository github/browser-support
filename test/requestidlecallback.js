import {apply, isPolyfilled, isSupported, requestIdleCallback} from '../lib/requestidlecallback.js'

describe('requestIdleCallback', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('resolves to first resolving value', async () => {
    const arg = await new Promise(resolve => requestIdleCallback(resolve))
    expect(Object.keys(arg)).to.eql(['didTimeout', 'timeRemaining'])
    expect(arg).to.have.property('didTimeout').to.be.a('boolean')
    expect(arg).to.have.property('timeRemaining').to.be.a('function')
    expect(arg.timeRemaining()).to.be.a('number').lessThan(50).greaterThanOrEqual(0)
  })
})
