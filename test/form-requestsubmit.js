import {requestSubmit, apply, isPolyfilled, isSupported} from '../lib/form-requestsubmit.js'

describe('requestSubmit', () => {
  let form
  beforeEach(() => {
    form = document.createElement('form')
    document.body.append(form)
  })
  afterEach(() => {
    form.remove()
  })

  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('does not dispatch or submit for invalid forms', () => {
    const input = document.createElement('input')
    input.required = true
    form.append(input)
    let called = false
    form.addEventListener('submit', () => {
      called = true
    })
    requestSubmit.call(form)
    expect(called).to.equal(false)
  })

  it('dispatches submit event', () => {
    const input = document.createElement('input')
    form.append(input)
    let called = false
    form.addEventListener('submit', event => {
      called = true
      event.stopPropagation()
    })
    requestSubmit.call(form)
    expect(called).to.equal(true)
  })

  it('passes submitter in event', () => {
    const input = document.createElement('input')
    input.type = 'button'
    form.append(input)
    let submitter = null
    form.addEventListener('submit', event => {
      submitter = event.submitter
      event.stopPropagation()
    })
    requestSubmit.call(form, input)
    expect(submitter).to.equal(input)
  })

  it('includes the input value in FormData', () => {
    const input = document.createElement('input')
    input.type = 'button'
    input.name = 'foo'
    input.value = '1'
    form.append(input)
    let formdata = null
    form.addEventListener('submit', event => {
      formdata = new FormData(form)
      event.stopPropagation()
    })
    requestSubmit.call(form, input)
    expect(formdata.get('foo')).to.equal('1')
    expect(Array.from(form.querySelectorAll('input')).length).to.equal(1)
  })
})
