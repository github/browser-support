import {apply, isPolyfilled, isSupported, withResolvers} from '../lib/promise-withResolvers.js'

describe('withResolvers', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('resolves to first resolving value', async () => {
    const arg = withResolvers()
    expect(Object.keys(arg).sort()).to.eql(['promise', 'reject', 'resolve'])
    expect(arg).to.have.property('promise').to.be.a('promise')
    expect(arg).to.have.property('resolve').to.be.a('function')
    expect(arg).to.have.property('reject').to.be.a('function')

    arg.resolve(1)
    expect(await arg.promise).to.be.eql(1)
  })

  it('rejects to first rejecting reason', async () => {
    const arg = withResolvers()
    expect(Object.keys(arg).sort()).to.eql(['promise', 'reject', 'resolve'])
    expect(arg).to.have.property('promise').to.be.a('promise')
    expect(arg).to.have.property('resolve').to.be.a('function')
    expect(arg).to.have.property('reject').to.be.a('function')

    const err = new Error('rejected')

    try {
      arg.reject(err)
      await arg.promise
      expect.fail('should fail')
    } catch (e) {
      expect(e).to.be.eql(err)
    }
  })
})
