import {apply, isPolyfilled, isSupported, objectHasOwn} from '../lib/object-hasown.js'

describe('objectHasOwn', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns boolean based on own properties', () => {
    expect(objectHasOwn({a: 1}, 'a')).to.equal(true)
    expect(objectHasOwn({a: 1}, 'b')).to.equal(false)
  })
})
