import {apply, isPolyfilled, isSupported, stringReplaceAll} from '../lib/string-replaceall.js'

describe('String#replaceAll', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('replaces all ocurrences of a string', async () => {
    expect(stringReplaceAll.call('aaa', 'a', 'bbb')).to.equal('bbbbbbbbb')
    expect(stringReplaceAll.call('aaa', 'a', 'aba')).to.equal('abaabaaba')
    expect(stringReplaceAll.call('_a_a_a_', 'a', 'b')).to.equal('_b_b_b_')
    expect(stringReplaceAll.call('aaa', 'a', (match, i, whole) => match + i + whole)).to.equal('a0aaaa1aaaa2aaa')
    expect(stringReplaceAll.call('aaa', /a/g, 'bbb')).to.equal('bbbbbbbbb')
  })
})
