import {apply, isPolyfilled, isSupported, replaceChildren} from '../lib/element-replacechildren.js'

describe('replaceChildren', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('replaces all Element children with given nodes', async () => {
    const el = document.createElement('div')
    // eslint-disable-next-line github/no-inner-html, github/unescaped-html-literal
    el.innerHTML = '<p></p><span>Hi</span>'
    replaceChildren.call(el, 'X')
    // eslint-disable-next-line github/no-inner-html
    expect(el.innerHTML).to.eql('X')
    const s = document.createElement('span')
    // eslint-disable-next-line github/unescaped-html-literal
    s.textContent = '<foo>'
    replaceChildren.call(el, s)
    // eslint-disable-next-line github/no-inner-html, github/unescaped-html-literal
    expect(el.innerHTML).to.eql('<span>&lt;foo&gt;</span>')
  })
})
