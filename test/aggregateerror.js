import {AggregateError, apply, isPolyfilled, isSupported} from '../lib/aggregateerror.js'

describe('AggregateError', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('returns error instance with `errors`, `message`', async () => {
    expect(new AggregateError([])).to.be.instanceOf(Error)
    expect(new AggregateError([])).to.be.instanceOf(AggregateError)
    expect(new AggregateError([])).to.not.equal(new AggregateError([]))
    expect(new AggregateError(['a', 'b']))
      .to.have.property('errors')
      .eql(['a', 'b'])
    expect(new AggregateError(['a', 'b'], 'hello'))
      .to.have.property('message')
      .eql('hello')
  })

  it('defines additional cause optional', () => {
    expect(new AggregateError(['a', 'b'], 'hello', {cause: 'a cause'}))
      .to.have.property('cause')
      .eql('a cause')
  })
})
