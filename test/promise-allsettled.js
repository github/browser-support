import {apply, isPolyfilled, isSupported, promiseAllSettled} from '../lib/promise-allsettled.js'

describe('Promise.allSettled', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns list of Promise value/rejections', async () => {
    expect(
      // eslint-disable-next-line prefer-promise-reject-errors
      await promiseAllSettled([Promise.resolve(1), Promise.reject(2), Promise.resolve(3), Promise.reject(4)])
    ).to.eql([
      {status: 'fulfilled', value: 1},
      {status: 'rejected', reason: 2},
      {status: 'fulfilled', value: 3},
      {status: 'rejected', reason: 4}
    ])
  })
})
