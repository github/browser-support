import {apply, arrayFindLast, isPolyfilled, isSupported} from '../lib/array-findlast.js'

describe('arrayFindLast', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns value that passes truthy', () => {
    expect(arrayFindLast.call([1, 2, 3], v => v === 3)).to.equal(3)
    const arr = [1, 2, 3]
    const recv = {}
    expect(
      arrayFindLast.call(
        arr,
        function (v, i, _arr) {
          // eslint-disable-next-line @typescript-eslint/no-invalid-this
          expect(this).to.equal(recv)
          expect(_arr).to.equal(arr)
          expect(v).to.equal(arr[i])
        },
        recv
      )
    )
  })
})
