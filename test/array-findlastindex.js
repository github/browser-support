import {apply, arrayFindLastIndex, isPolyfilled, isSupported} from '../lib/array-findlastindex.js'

describe('arrayFindLastIndex', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns value that passes truthy', () => {
    expect(arrayFindLastIndex.call([1, 2, 3], v => v === 3)).to.equal(2)
    expect(arrayFindLastIndex.call([1, 2, 3], v => v === 1)).to.equal(0)
    const arr = [1, 2, 3]
    const recv = {}
    expect(
      arrayFindLastIndex.call(
        arr,
        function (v, i, _arr) {
          // eslint-disable-next-line @typescript-eslint/no-invalid-this
          expect(this).to.equal(recv)
          expect(_arr).to.equal(arr)
          expect(v).to.equal(arr[i])
        },
        recv,
      ),
    )
  })
})
