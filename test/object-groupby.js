import {expect} from 'chai'
import {apply, isPolyfilled, isSupported, groupBy} from '../src/object-groupby.ts'

describe('Object.groupBy', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('groups items by key', () => {
    const items = [
      {type: 'fruit', name: 'apple'},
      {type: 'vegetable', name: 'carrot'},
      {type: 'fruit', name: 'banana'},
      {type: 'vegetable', name: 'broccoli'},
    ]
    const result = groupBy(items, item => item.type)
    expect(result).to.have.property('fruit')
    expect(result.fruit).to.have.lengthOf(2)
    expect(result.fruit?.[0]).to.eql({type: 'fruit', name: 'apple'})
    expect(result.fruit?.[1]).to.eql({type: 'fruit', name: 'banana'})
    expect(result).to.have.property('vegetable')
    expect(result.vegetable).to.have.lengthOf(2)
    expect(result.vegetable?.[0]).to.eql({type: 'vegetable', name: 'carrot'})
    expect(result.vegetable?.[1]).to.eql({type: 'vegetable', name: 'broccoli'})
  })

  it('passes index to callback', () => {
    const items = ['a', 'b', 'c', 'd']
    const result = groupBy(items, (_item, index) => (index % 2 === 0 ? 'even' : 'odd'))
    expect(result.even).to.eql(['a', 'c'])
    expect(result.odd).to.eql(['b', 'd'])
  })

  it('handles empty arrays', () => {
    const result = groupBy([], () => 'key')
    expect(Object.keys(result)).to.have.lengthOf(0)
  })

  it('works with numeric keys', () => {
    const items = [1, 2, 3, 4, 5, 6]
    const result = groupBy(items, item => item % 3)
    expect(result[0]).to.eql([3, 6])
    expect(result[1]).to.eql([1, 4])
    expect(result[2]).to.eql([2, 5])
  })

  it('handles __proto__ key safely without prototype pollution', () => {
    const items = ['a', 'b', 'c']
    const result = groupBy(items, (_item, index) => (index === 0 ? '__proto__' : 'other'))
    // The __proto__ key should exist as an own property, not affect Object.prototype
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).to.be.true
    expect(result['__proto__']).to.eql(['a'])
    expect(result['other']).to.eql(['b', 'c'])
    // Object.prototype should not be polluted
    expect({}['__proto__']).to.not.eql(['a'])
  })
})
