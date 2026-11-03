import {expect} from 'chai'
import {apply, cancelIdleCallback, isPolyfilled, isSupported, requestIdleCallback} from '../src/requestidlecallback.ts'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const busyWait = ms => {
  const end = performance.now() + ms
  while (performance.now() < end) {
    // spin
  }
}

describe('requestIdleCallback', () => {
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  let queuedFrames = []
  let issuedFrames = []
  let cancelledFrames = new Set()
  let nextFrameId = 1

  // Real animation frames are throttled or never delivered when the test page is in the background (wtr runs
  // test files in parallel), so frames are driven by hand: requestAnimationFrame only queues, and runFrame()
  // plays the queue in registration order, like a browser does at the next rendering opportunity. Not calling
  // runFrame() simulates a frame that never comes.
  const useManualFrames = () => {
    queuedFrames = []
    issuedFrames = []
    cancelledFrames = new Set()
    globalThis.requestAnimationFrame = cb => {
      const id = nextFrameId++
      queuedFrames.push({id, cb})
      issuedFrames.push(cb)
      return id
    }
    globalThis.cancelAnimationFrame = id => {
      cancelledFrames.add(id)
    }
  }

  const runFrame = () => {
    const frames = queuedFrames
    queuedFrames = []
    const now = performance.now()
    for (const {id, cb} of frames) {
      if (!cancelledFrames.has(id)) cb(now)
    }
  }

  // Fires every frame callback ever registered, even cancelled ones: a late or stray frame must not run work twice.
  const runAllIssuedFrames = () => {
    const now = performance.now()
    for (const cb of issuedFrames) cb(now)
  }

  const stubVisibility = state => {
    Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => state})
  }

  beforeEach(() => {
    useManualFrames()
    stubVisibility('visible')
  })

  afterEach(() => {
    globalThis.requestAnimationFrame = realRaf
    globalThis.cancelAnimationFrame = realCaf
    delete document.visibilityState
    queuedFrames = []
  })

  it('has standard isSupported, isPolyfilled, apply API', () => {
    expect(isSupported).to.be.a('function')
    expect(isPolyfilled).to.be.a('function')
    expect(apply).to.be.a('function')
    expect(isSupported()).to.be.a('boolean')
    expect(isPolyfilled()).to.equal(false)
  })

  it('resolves to first resolving value', async () => {
    const arg = await new Promise(resolve => {
      requestIdleCallback(resolve)
      runFrame()
    })
    expect(arg).to.have.property('didTimeout').to.be.a('boolean')
    expect(arg).to.have.property('timeRemaining').to.be.a('function')
    expect(arg.timeRemaining()).to.be.a('number').lessThanOrEqual(10).greaterThanOrEqual(0)
  })

  describe('scheduling', () => {
    it('does not run the callback before the next animation frame', async () => {
      const order = []
      requestIdleCallback(() => order.push('idle'))
      requestAnimationFrame(() => order.push('frame'))
      await sleep(100)
      expect(order).to.eql([])
      runFrame()
      // The callback is not run synchronously from the frame; it is posted as a task.
      expect(order).to.eql(['frame'])
      await sleep(100)
      expect(order).to.eql(['frame', 'idle'])
    })

    it('accepts null options like native requestIdleCallback', async () => {
      const received = []
      const id = requestIdleCallback(deadline => received.push(deadline.didTimeout), null)
      expect(id).to.be.a('number')
      runFrame()
      await sleep(100)
      expect(received).to.eql([false])
    })

    it('throws without scheduling the callback when reading options.timeout throws', async () => {
      let calls = 0
      const options = {
        get timeout() {
          throw new Error('boom')
        },
      }
      expect(() => requestIdleCallback(() => calls++, options)).to.throw('boom')
      runFrame()
      await sleep(50)
      expect(calls).to.equal(0)
    })

    it('returns distinct numeric ids', () => {
      const ids = [requestIdleCallback(() => {}), requestIdleCallback(() => {}), requestIdleCallback(() => {})]
      for (const id of ids) {
        expect(id).to.be.a('number')
        cancelIdleCallback(id)
      }
      expect(new Set(ids).size).to.equal(3)
    })

    it('runs each of several requests once', async () => {
      const calls = [0, 0, 0]
      for (let i = 0; i < calls.length; i += 1) requestIdleCallback(() => calls[i]++)
      runFrame()
      await sleep(100)
      expect(calls).to.eql([1, 1, 1])
    })
  })

  describe('deadline', () => {
    const getDeadline = (options = {}) =>
      new Promise(resolve => {
        requestIdleCallback(resolve, options)
        runFrame()
      })

    it('reports didTimeout false when there is no timeout', async () => {
      const deadline = await getDeadline()
      expect(deadline.didTimeout).to.equal(false)
    })

    it('reports didTimeout false when the frame path wins before a long timeout', async () => {
      const deadline = await getDeadline({timeout: 5000})
      expect(deadline.didTimeout).to.equal(false)
    })

    it('has close to 10ms remaining when the callback starts', async () => {
      // Read inside the callback: a read after `await` can be delayed past the budget on a loaded machine.
      const remaining = await new Promise(resolve => {
        requestIdleCallback(deadline => resolve(deadline.timeRemaining()))
        runFrame()
      })
      expect(remaining).to.be.greaterThan(8)
      expect(remaining).to.be.lessThanOrEqual(10)
    })

    it('decreases as the callback keeps running', async () => {
      const readings = await new Promise(resolve => {
        requestIdleCallback(deadline => {
          const first = deadline.timeRemaining()
          busyWait(3)
          resolve({first, second: deadline.timeRemaining()})
        })
        runFrame()
      })
      expect(readings.second).to.be.lessThan(readings.first)
      expect(readings.second).to.be.lessThanOrEqual(7.5)
    })

    it('reaches 0 after running longer than 10ms', async () => {
      const remaining = await new Promise(resolve => {
        requestIdleCallback(deadline => {
          busyWait(12)
          resolve(deadline.timeRemaining())
        })
        runFrame()
      })
      expect(remaining).to.equal(0)
    })

    it('measures the budget from callback start, not from scheduling', async () => {
      // Hold the main thread so the callback is delayed well past 10ms after scheduling.
      let remaining
      requestIdleCallback(deadline => {
        remaining = deadline.timeRemaining()
      })
      runFrame()
      busyWait(15)
      await sleep(100)
      expect(remaining).to.be.greaterThan(8)
    })
  })

  describe('timeout', () => {
    it('runs with didTimeout true and no time remaining when the frame never comes', async () => {
      const received = []
      requestIdleCallback(
        deadline => {
          received.push({didTimeout: deadline.didTimeout, remaining: deadline.timeRemaining()})
        },
        {timeout: 20},
      )
      await sleep(150)
      expect(received).to.eql([{didTimeout: true, remaining: 0}])
    })

    it('does not run before the timeout elapses when the frame never comes', async () => {
      let calls = 0
      requestIdleCallback(() => calls++, {timeout: 300})
      await sleep(50)
      expect(calls).to.equal(0)
      await sleep(500)
      expect(calls).to.equal(1)
    })

    it('runs at most once when the frame fires after the timeout already ran the callback', async () => {
      let calls = 0
      requestIdleCallback(() => calls++, {timeout: 20})
      await sleep(150)
      expect(calls).to.equal(1)
      runAllIssuedFrames()
      await sleep(100)
      expect(calls).to.equal(1)
    })

    it('runs at most once when the timeout fires after the frame already ran the callback', async () => {
      let calls = 0
      requestIdleCallback(() => calls++, {timeout: 40})
      runFrame()
      await sleep(300)
      expect(calls).to.equal(1)
    })
  })

  describe('cancelIdleCallback', () => {
    it('cancels immediately after scheduling', async () => {
      let calls = 0
      const id = requestIdleCallback(() => calls++)
      cancelIdleCallback(id)
      runFrame()
      await sleep(100)
      expect(calls).to.equal(0)
    })

    it('cancels after the animation frame fired but before the callback ran', async () => {
      let cancelled = 0
      let control = 0
      const id = requestIdleCallback(() => cancelled++)
      requestIdleCallback(() => control++)
      // Registered after the polyfill's frame callbacks, so it runs after them in the same frame.
      requestAnimationFrame(() => cancelIdleCallback(id))
      runFrame()
      await sleep(100)
      expect(cancelled).to.equal(0)
      expect(control).to.equal(1)
    })

    it('cancels after the frame fired when a timeout is also pending', async () => {
      let calls = 0
      const id = requestIdleCallback(() => calls++, {timeout: 20})
      requestAnimationFrame(() => cancelIdleCallback(id))
      runFrame()
      await sleep(150)
      expect(calls).to.equal(0)
    })

    it('cancels a request whose timeout is pending', async () => {
      let calls = 0
      const id = requestIdleCallback(() => calls++, {timeout: 20})
      cancelIdleCallback(id)
      await sleep(150)
      expect(calls).to.equal(0)
      // A frame arriving late must not revive it either.
      runAllIssuedFrames()
      await sleep(100)
      expect(calls).to.equal(0)
    })

    it('only cancels the given request', async () => {
      let cancelled = 0
      let kept = 0
      const id = requestIdleCallback(() => cancelled++)
      requestIdleCallback(() => kept++)
      cancelIdleCallback(id)
      runFrame()
      await sleep(100)
      expect(cancelled).to.equal(0)
      expect(kept).to.equal(1)
    })

    it('is a no-op for unknown ids', async () => {
      let calls = 0
      requestIdleCallback(() => calls++)
      expect(() => cancelIdleCallback(987654321)).to.not.throw()
      expect(() => cancelIdleCallback(-1)).to.not.throw()
      expect(() => cancelIdleCallback(0)).to.not.throw()
      runFrame()
      await sleep(100)
      expect(calls).to.equal(1)
    })

    it('is a no-op for an id that already ran', async () => {
      let id = 0
      await new Promise(resolve => {
        id = requestIdleCallback(() => setTimeout(resolve))
        runFrame()
      })
      expect(() => cancelIdleCallback(id)).to.not.throw()
    })
  })

  describe('hidden documents', () => {
    it('runs without waiting for an animation frame when already hidden at schedule time', async () => {
      stubVisibility('hidden')
      const received = []
      requestIdleCallback(deadline => received.push(deadline.didTimeout))
      await sleep(100)
      expect(received).to.eql([false])
    })

    it('runs without the frame when the document becomes hidden while waiting', async () => {
      const received = []
      requestIdleCallback(deadline => received.push(deadline.didTimeout))
      await sleep(50)
      expect(received).to.eql([])

      stubVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await sleep(100)
      expect(received).to.eql([false])
    })

    it('runs the callback only once if the frame also fires after the document became hidden', async () => {
      let calls = 0
      requestIdleCallback(() => calls++)
      stubVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await sleep(100)
      runAllIssuedFrames()
      await sleep(100)
      expect(calls).to.equal(1)
    })

    it('does not run a cancelled request when the document becomes hidden', async () => {
      let calls = 0
      const id = requestIdleCallback(() => calls++)
      cancelIdleCallback(id)
      stubVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await sleep(100)
      expect(calls).to.equal(0)
    })
  })

  describe('apply', () => {
    it('leaves a native requestIdleCallback alone', () => {
      // Test runs in Chrome, which ships native requestIdleCallback.
      expect(isSupported()).to.equal(true)
      const nativeRequest = globalThis.requestIdleCallback
      const nativeCancel = globalThis.cancelIdleCallback
      apply()
      expect(globalThis.requestIdleCallback).to.equal(nativeRequest)
      expect(globalThis.cancelIdleCallback).to.equal(nativeCancel)
      expect(globalThis.requestIdleCallback).to.not.equal(requestIdleCallback)
      expect(globalThis.cancelIdleCallback).to.not.equal(cancelIdleCallback)
      expect(isPolyfilled()).to.equal(false)
    })
  })
})
