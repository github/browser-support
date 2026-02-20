import {expect} from 'chai'
import {apply, isPolyfilled, isSupported, groupBy} from '../src/map-groupby.ts'

describe('Map.groupBy', () => {
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
    expect(result).to.be.instanceOf(Map)
    expect(result.has('fruit')).to.be.true
    expect(result.get('fruit')).to.have.lengthOf(2)
    expect(result.get('fruit')?.[0]).to.eql({type: 'fruit', name: 'apple'})
    expect(result.get('fruit')?.[1]).to.eql({type: 'fruit', name: 'banana'})
    expect(result.has('vegetable')).to.be.true
    expect(result.get('vegetable')).to.have.lengthOf(2)
    expect(result.get('vegetable')?.[0]).to.eql({type: 'vegetable', name: 'carrot'})
    expect(result.get('vegetable')?.[1]).to.eql({type: 'vegetable', name: 'broccoli'})
  })

  it('passes index to callback', () => {
    const items = ['a', 'b', 'c', 'd']
    const result = groupBy(items, (_item, index) => (index % 2 === 0 ? 'even' : 'odd'))
    expect(result.get('even')).to.eql(['a', 'c'])
    expect(result.get('odd')).to.eql(['b', 'd'])
  })

  it('handles empty arrays', () => {
    const result = groupBy([], () => 'key')
    expect(result.size).to.equal(0)
  })

  it('works with object keys', () => {
    const keyA = {id: 1}
    const keyB = {id: 2}
    const items = [
      {key: keyA, value: 'a'},
      {key: keyB, value: 'b'},
      {key: keyA, value: 'c'},
    ]
    const result = groupBy(items, item => item.key)
    expect(result.has(keyA)).to.be.true
    expect(result.get(keyA)).to.have.lengthOf(2)
    expect(result.has(keyB)).to.be.true
    expect(result.get(keyB)).to.have.lengthOf(1)
  })
})
