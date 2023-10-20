import {apply, isPolyfilled, isSupported, checkVisibility} from '../lib/element-checkvisibility.js'

describe('checkVisibility', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('checks visibility of elements', async () => {
    // These tests originate from
    // https://github.com/web-platform-tests/wpt/blob/master/css/cssom-view/checkVisibility.html
    const el = document.createElement('div')
    // eslint-disable-next-line github/no-inner-html
    el.innerHTML = `
      <div id=visibilityhidden style="visibility:hidden">hello</div>
      <div style="content-visibility:hidden">
        <div id=cvhidden>hello</div>
      </div>
      <div style="content-visibility:auto">
        <div id=cvauto>hello</div>
      </div>
      <div id=displaynone style="display:none">hello</div>
      <div style="display:none" class="shadow-host-with-slot">
        <div id="slottedindisplaynone" slot="slot">slotted</div>
      </div>
      <div id=displaycontents style="display:contents">
        <div id=displaycontentschild>hello</div>
      </div>
      <div id=opacityzero style="opacity:0">hello</div>
      <div style="opacity:0" class="shadow-host-with-slot">
        <div id="slottedinopacityzero" slot="slot">slotted</div>
      </div>
      <div style="content-visibility:hidden">
        <div id=cvhiddenchildwithupdate></div>
      </div>
      <div style="content-visibility:hidden" id=cvhiddenwithupdate></div>
      <div style="content-visibility:hidden" class="shadow-host-with-slot">
        <div id="slottedincvhidden" slot="slot">slotted</div>
      </div>
      <div style="height:10000px">spacer</div>
      <div style="content-visibility:auto">
        <div id=cvautooffscreen>hello</div>
      </div>
      <div id=cvautocontainer>
        <div id=cvautochild></div>
      </div>
      <div style="content-visibility:auto">
        <div style="content-visibility:auto">
          <div id=nestedcvautochild></div>
        </div>
    `
    document.body.append(el)
    for (const host of document.querySelectorAll('.shadow-host-with-slot')) {
      const shadowRoot = host.attachShadow({mode: 'open'})
      const slot = document.createElement('slot')
      slot.name = 'slot'
      shadowRoot.appendChild(slot)
    }
    expect(checkVisibility.call(document.getElementById('visibilityhidden'), {checkVisibilityCSS: true})).to.equal(
      false,
    )
    expect(checkVisibility.call(document.getElementById('visibilityhidden'), {checkVisibilityCSS: false})).to.equal(
      true,
    )
    expect(checkVisibility.call(document.getElementById('cvhidden'))).to.equal(false)
    expect(checkVisibility.call(document.getElementById('slottedincvhidden'))).to.equal(false)
    expect(checkVisibility.call(document.getElementById('cvauto'))).to.equal(true)
    expect(checkVisibility.call(document.getElementById('cvautooffscreen'))).to.equal(true)
    expect(checkVisibility.call(document.getElementById('displaynone'))).to.equal(false)
    expect(checkVisibility.call(document.getElementById('slottedindisplaynone'))).to.equal(false)
    expect(checkVisibility.call(document.getElementById('displaycontents'))).to.equal(false)
    expect(checkVisibility.call(document.getElementById('displaycontentschild'))).to.equal(true)
    expect(checkVisibility.call(document.getElementById('opacityzero'), {checkOpacity: true})).to.equal(false)
    expect(checkVisibility.call(document.getElementById('opacityzero'), {checkOpacity: false})).to.equal(true)
    expect(checkVisibility.call(document.getElementById('slottedinopacityzero'), {checkOpacity: true})).to.equal(false)
    expect(checkVisibility.call(document.getElementById('slottedinopacityzero'), {checkOpacity: false})).to.equal(true)
    const cvautocontainer = document.getElementById('cvautocontainer')
    const cvautochild = document.getElementById('cvautochild')
    cvautocontainer.style.contentVisibility = 'auto'
    cvautochild.style.visibility = 'hidden'
    expect(checkVisibility.call(cvautochild, {checkVisibilityCSS: true})).to.equal(false)
    cvautochild.style.visibility = 'visible'
    expect(checkVisibility.call(cvautochild, {checkVisibilityCSS: true})).to.equal(true)
    expect(checkVisibility.call(document.getElementById('nestedcvautochild'))).to.equal(true)
    const cvhiddenchildwithupdate = document.getElementById('cvhiddenchildwithupdate')
    cvhiddenchildwithupdate.getBoundingClientRect()
    expect(checkVisibility.call(cvhiddenchildwithupdate)).to.equal(false)
    const cvhiddenwithupdate = document.getElementById('cvhiddenwithupdate')
    cvhiddenwithupdate.getBoundingClientRect()
    expect(checkVisibility.call(cvhiddenwithupdate)).to.equal(true)
  })
})
