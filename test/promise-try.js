import {expect} from 'chai'
import {apply, isPolyfilled, isSupported, promiseTry} from '../src/promise-try.ts'

describe('Promise.try', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.be.a('boolean')
  })

  it('resolves with the return value of a successful function', async () => {
    const result = await promiseTry(() => 42)
    expect(result).to.equal(42)
  })

  it('resolves with the resolved value of a returned promise', async () => {
    const result = await promiseTry(() => Promise.resolve(42))
    expect(result).to.equal(42)
  })

  it('rejects with the error thrown by the function', async () => {
    const error = new Error('rejected')
    try {
      await promiseTry(() => {
        throw error
      })
      expect.fail('should fail')
    } catch (e) {
      expect(e).to.equal(error)
    }
  })

  it('rejects with the rejected value of a returned promise', async () => {
    const error = new Error('rejected')
    try {
      await promiseTry(() => Promise.reject(error))
      expect.fail('should fail')
    } catch (e) {
      expect(e).to.equal(error)
    }
  })

  it('handles synchronous values', async () => {
    const result = await promiseTry(() => 'sync')
    expect(result).to.equal('sync')
  })
})
