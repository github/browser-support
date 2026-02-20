import {expect} from 'chai'
import {apply, isPolyfilled, isSupported} from '../src/iterator-helpers.ts'

// eslint-disable-next-line i18n-text/no-en
describe('Iterator helpers', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.be.a('boolean')
  })

  // Helper to create an iterator from an array
  function* arrayIterator(arr) {
    for (const item of arr) {
      yield item
    }
  }

  describe('map', () => {
    beforeEach(() => apply())

    it('maps values', () => {
      const iter = arrayIterator([1, 2, 3])
      const mapped = iter.map(x => x * 2)
      expect([...mapped]).to.eql([2, 4, 6])
    })

    it('passes index to mapper', () => {
      const iter = arrayIterator(['a', 'b', 'c'])
      const mapped = iter.map((x, i) => `${i}:${x}`)
      expect([...mapped]).to.eql(['0:a', '1:b', '2:c'])
    })
  })

  describe('filter', () => {
    beforeEach(() => apply())

    it('filters values', () => {
      const iter = arrayIterator([1, 2, 3, 4, 5])
      const filtered = iter.filter(x => x % 2 === 0)
      expect([...filtered]).to.eql([2, 4])
    })

    it('passes index to predicate', () => {
      const iter = arrayIterator(['a', 'b', 'c', 'd'])
      const filtered = iter.filter((_, i) => i % 2 === 0)
      expect([...filtered]).to.eql(['a', 'c'])
    })
  })

  describe('take', () => {
    beforeEach(() => apply())

    it('takes first n values', () => {
      const iter = arrayIterator([1, 2, 3, 4, 5])
      const taken = iter.take(3)
      expect([...taken]).to.eql([1, 2, 3])
    })

    it('handles taking more than available', () => {
      const iter = arrayIterator([1, 2])
      const taken = iter.take(5)
      expect([...taken]).to.eql([1, 2])
    })
  })

  describe('drop', () => {
    beforeEach(() => apply())

    it('drops first n values', () => {
      const iter = arrayIterator([1, 2, 3, 4, 5])
      const dropped = iter.drop(2)
      expect([...dropped]).to.eql([3, 4, 5])
    })

    it('handles dropping more than available', () => {
      const iter = arrayIterator([1, 2])
      const dropped = iter.drop(5)
      expect([...dropped]).to.eql([])
    })
  })

  describe('flatMap', () => {
    beforeEach(() => apply())

    it('flattens mapped values', () => {
      const iter = arrayIterator([1, 2, 3])
      const flatMapped = iter.flatMap(x => [x, x * 2])
      expect([...flatMapped]).to.eql([1, 2, 2, 4, 3, 6])
    })

    it('handles empty results', () => {
      const iter = arrayIterator([1, 2, 3])
      const flatMapped = iter.flatMap(x => (x % 2 === 0 ? [x] : []))
      expect([...flatMapped]).to.eql([2])
    })
  })

  describe('reduce', () => {
    beforeEach(() => apply())

    it('reduces with initial value', () => {
      const iter = arrayIterator([1, 2, 3, 4])
      const sum = iter.reduce((acc, x) => acc + x, 0)
      expect(sum).to.equal(10)
    })

    it('reduces without initial value', () => {
      const iter = arrayIterator([1, 2, 3, 4])
      const sum = iter.reduce((acc, x) => acc + x)
      expect(sum).to.equal(10)
    })

    it('throws on empty iterator without initial value', () => {
      const iter = arrayIterator([])
      expect(() => iter.reduce((acc, x) => acc + x)).to.throw(TypeError)
    })
  })

  describe('toArray', () => {
    beforeEach(() => apply())

    it('converts iterator to array', () => {
      const iter = arrayIterator([1, 2, 3])
      expect(iter.toArray()).to.eql([1, 2, 3])
    })

    it('handles empty iterator', () => {
      const iter = arrayIterator([])
      expect(iter.toArray()).to.eql([])
    })
  })

  describe('forEach', () => {
    beforeEach(() => apply())

    it('calls callback for each value', () => {
      const iter = arrayIterator([1, 2, 3])
      const results = []
      // eslint-disable-next-line github/array-foreach
      iter.forEach((x, i) => results.push({value: x, index: i}))
      expect(results).to.eql([
        {value: 1, index: 0},
        {value: 2, index: 1},
        {value: 3, index: 2},
      ])
    })
  })

  describe('some', () => {
    beforeEach(() => apply())

    it('returns true if any value matches', () => {
      const iter = arrayIterator([1, 2, 3, 4])
      expect(iter.some(x => x > 3)).to.be.true
    })

    it('returns false if no value matches', () => {
      const iter = arrayIterator([1, 2, 3])
      expect(iter.some(x => x > 5)).to.be.false
    })
  })

  describe('every', () => {
    beforeEach(() => apply())

    it('returns true if all values match', () => {
      const iter = arrayIterator([2, 4, 6])
      expect(iter.every(x => x % 2 === 0)).to.be.true
    })

    it('returns false if any value does not match', () => {
      const iter = arrayIterator([2, 3, 4])
      expect(iter.every(x => x % 2 === 0)).to.be.false
    })
  })

  describe('find', () => {
    beforeEach(() => apply())

    it('returns first matching value', () => {
      const iter = arrayIterator([1, 2, 3, 4])
      expect(iter.find(x => x > 2)).to.equal(3)
    })

    it('returns undefined if no match', () => {
      const iter = arrayIterator([1, 2, 3])
      expect(iter.find(x => x > 5)).to.be.undefined
    })
  })

  describe('Iterator.from', () => {
    beforeEach(() => apply())

    it('converts iterable to iterator', () => {
      const IteratorConstructor = globalThis.Iterator
      if (!IteratorConstructor?.from) {
        // Skip if Iterator.from is not available after polyfill
        return
      }
      const iter = IteratorConstructor.from([1, 2, 3])
      expect([...iter]).to.eql([1, 2, 3])
    })

    it('returns iterator as-is', () => {
      const IteratorConstructor = globalThis.Iterator
      if (!IteratorConstructor?.from) {
        // Skip if Iterator.from is not available after polyfill
        return
      }
      const original = arrayIterator([1, 2, 3])
      const iter = IteratorConstructor.from(original)
      expect(iter).to.equal(original)
    })
  })

  describe('chaining', () => {
    beforeEach(() => apply())

    it('chains multiple operations', () => {
      const iter = arrayIterator([1, 2, 3, 4, 5, 6])
      const result = iter
        .filter(x => x % 2 === 0)
        .map(x => x * 2)
        .take(2)
        .toArray()
      expect(result).to.eql([4, 8])
    })
  })
})
