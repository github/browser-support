import {expect} from 'chai'
import {
  apply,
  isPolyfilled,
  isSupported,
  union,
  intersection,
  difference,
  symmetricDifference,
  isSubsetOf,
  isSupersetOf,
  isDisjointFrom,
} from '../src/set-methods.ts'

// eslint-disable-next-line i18n-text/no-en
describe('Set methods', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  describe('union', () => {
    it('returns a new Set with elements from both sets', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([3, 4, 5])
      const result = union.call(a, b)
      expect(result).to.be.instanceof(Set)
      expect([...result].sort()).to.eql([1, 2, 3, 4, 5])
    })

    it('handles empty sets', () => {
      const a = new Set([1, 2])
      const result = union.call(a, new Set())
      expect([...result].sort()).to.eql([1, 2])
    })
  })

  describe('intersection', () => {
    it('returns a new Set with elements in both sets', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([2, 3, 4])
      const result = intersection.call(a, b)
      expect(result).to.be.instanceof(Set)
      expect([...result].sort()).to.eql([2, 3])
    })

    it('returns empty set when no common elements', () => {
      const a = new Set([1, 2])
      const b = new Set([3, 4])
      const result = intersection.call(a, b)
      expect(result.size).to.equal(0)
    })
  })

  describe('difference', () => {
    it('returns a new Set with elements in this but not other', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([2, 3, 4])
      const result = difference.call(a, b)
      expect(result).to.be.instanceof(Set)
      expect([...result]).to.eql([1])
    })

    it('returns a copy of this when no overlap', () => {
      const a = new Set([1, 2])
      const b = new Set([3, 4])
      const result = difference.call(a, b)
      expect([...result].sort()).to.eql([1, 2])
    })
  })

  describe('symmetricDifference', () => {
    it('returns elements in one set but not both', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([2, 3, 4])
      const result = symmetricDifference.call(a, b)
      expect(result).to.be.instanceof(Set)
      expect([...result].sort()).to.eql([1, 4])
    })

    it('returns empty set for identical sets', () => {
      const a = new Set([1, 2])
      const result = symmetricDifference.call(a, new Set([1, 2]))
      expect(result.size).to.equal(0)
    })
  })

  describe('isSubsetOf', () => {
    it('returns true when all elements are in the other set', () => {
      const a = new Set([1, 2])
      const b = new Set([1, 2, 3])
      expect(isSubsetOf.call(a, b)).to.equal(true)
    })

    it('returns false when some elements are not in the other set', () => {
      const a = new Set([1, 2, 4])
      const b = new Set([1, 2, 3])
      expect(isSubsetOf.call(a, b)).to.equal(false)
    })

    it('returns true for empty set', () => {
      const a = new Set()
      const b = new Set([1, 2])
      expect(isSubsetOf.call(a, b)).to.equal(true)
    })
  })

  describe('isSupersetOf', () => {
    it('returns true when this set contains all elements of other', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([1, 2])
      expect(isSupersetOf.call(a, b)).to.equal(true)
    })

    it('returns false when other has elements not in this', () => {
      const a = new Set([1, 2])
      const b = new Set([1, 2, 3])
      expect(isSupersetOf.call(a, b)).to.equal(false)
    })

    it('returns true when other is empty', () => {
      const a = new Set([1, 2])
      expect(isSupersetOf.call(a, new Set())).to.equal(true)
    })
  })

  describe('isDisjointFrom', () => {
    it('returns true when sets have no common elements', () => {
      const a = new Set([1, 2])
      const b = new Set([3, 4])
      expect(isDisjointFrom.call(a, b)).to.equal(true)
    })

    it('returns false when sets share elements', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([3, 4])
      expect(isDisjointFrom.call(a, b)).to.equal(false)
    })

    it('returns true when either set is empty', () => {
      const a = new Set([1, 2])
      expect(isDisjointFrom.call(a, new Set())).to.equal(true)
    })
  })
})
