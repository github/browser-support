import {apply, isPolyfilled, isSupported, promiseAny} from '../lib/promise-any.js'

describe('promiseAny', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('resolves to first resolving value', async () => {
    const err = new Error('nope')
    expect(await promiseAny([Promise.resolve(1), Promise.resolve(2), Promise.reject(err)])).to.equal(1)
    expect(await promiseAny([Promise.reject(err), Promise.resolve(1), Promise.resolve(2)])).to.equal(1)
  })
})
