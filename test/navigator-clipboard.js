import {expect} from 'chai'
import {clipboardRead, clipboardWrite, apply, isPolyfilled, isSupported} from '../src/navigator-clipboard.ts'

describe('navigator clipboard', () => {
  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  describe('read', () => {
    it('read returns array of 1 clipboard entry with plaintext of readText value', async () => {
      navigator.clipboard.readText = () => Promise.resolve('foo')
      const arr = await clipboardRead()
      expect(arr).to.have.lengthOf(1)
      expect(arr[0]).to.be.an.instanceof(globalThis.ClipboardItem)
      expect(arr[0].types).to.eql(['text/plain'])
      expect(await (await arr[0].getType('text/plain')).text()).to.eql('foo')
    })
  })

  describe('write', () => {
    it('unpacks text/plain content to writeText', async () => {
      const calls = []
      navigator.clipboard.writeText = (...args) => calls.push(args)
      await clipboardWrite([
        new globalThis.ClipboardItem({
          'foo/bar': 'horrible',
          'text/plain': Promise.resolve('foo'),
        }),
      ])
      expect(calls).to.have.lengthOf(1)
      expect(calls[0]).to.eql(['foo'])
    })

    it('accepts multiple clipboard items, picking the first', async () => {
      const calls = []
      navigator.clipboard.writeText = (...args) => calls.push(args)
      await clipboardWrite([
        new globalThis.ClipboardItem({
          'foo/bar': 'horrible',
          'text/plain': Promise.resolve('multiple-pass'),
        }),
        new globalThis.ClipboardItem({
          'foo/bar': 'multiple-fail',
          'text/plain': Promise.resolve('multiple-fail'),
        }),
      ])
      expect(calls).to.have.lengthOf(1)
      expect(calls[0]).to.eql(['multiple-pass'])
    })
  })
})
