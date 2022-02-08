import {apply, arrayLikeAt, isPolyfilled, isSupported} from '../lib/arraylike-at.js'

describe('arrayLikeAt', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns value at given index', () => {
    expect(arrayLikeAt.call([1, 2, 3], -1)).to.equal(3)
    expect(arrayLikeAt.call('bar', -2)).to.equal('a')
    expect(arrayLikeAt.call('bar', 1)).to.equal('a')
  })
})
