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

  afterEach(async () => {
    // Only one idle period is scheduled at a time, and a test may end with that period still waiting for a frame
    // that never came (e.g. a timeout test). Deliver any such frame so the next test starts from a clean slate.
    for (let i = 0; i < 3; i += 1) {
      runFrame()
      await sleep(10)
    }
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
    expect(arg.timeRemaining()).to.be.a('number').lessThanOrEqual(5).greaterThanOrEqual(0)
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

    it('throws without registering the callback when options.timeout cannot be converted', async () => {
      let calls = 0
      expect(() => requestIdleCallback(() => calls++, {timeout: Symbol('bad')})).to.throw(TypeError)
      requestIdleCallback(() => {})
      runFrame()
      await sleep(100)
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

    it('has close to 5ms remaining (one slice) when the first callback starts', async () => {
      // Read inside the callback: a read after `await` can be delayed past the budget on a loaded machine.
      const remaining = await new Promise(resolve => {
        requestIdleCallback(deadline => resolve(deadline.timeRemaining()))
        runFrame()
      })
      expect(remaining).to.be.greaterThan(3)
      expect(remaining).to.be.lessThanOrEqual(5)
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
      // 5ms slice minus 3ms of spinning.
      expect(readings.second).to.be.lessThanOrEqual(2.5)
    })

    it('reaches 0 after running longer than 5ms', async () => {
      const remaining = await new Promise(resolve => {
        requestIdleCallback(deadline => {
          busyWait(6)
          resolve(deadline.timeRemaining())
        })
        runFrame()
      })
      expect(remaining).to.equal(0)
    })

    it('measures the budget from callback start, not from scheduling', async () => {
      // Hold the main thread so the callback is delayed well past the budget after scheduling.
      let remaining
      requestIdleCallback(deadline => {
        remaining = deadline.timeRemaining()
      })
      runFrame()
      busyWait(15)
      await sleep(100)
      expect(remaining).to.be.greaterThan(3)
    })
  })

  describe('idle periods', () => {
    it('runs several callbacks in FIFO order', async () => {
      const order = []
      for (let i = 0; i < 5; i += 1) requestIdleCallback(() => order.push(i))
      runFrame()
      await sleep(100)
      expect(order).to.eql([0, 1, 2, 3, 4])
    })

    it('caps a later callback at what is left of the 10ms period', async () => {
      // Read inside the callbacks: a read after `await` can be delayed on a loaded machine.
      let firstStart
      let secondStart
      let secondRemaining
      requestIdleCallback(() => {
        firstStart = performance.now()
        busyWait(7)
      })
      requestIdleCallback(deadline => {
        secondStart = performance.now()
        secondRemaining = deadline.timeRemaining()
      })
      // A stalled machine can push the second callback into the next frame, so deliver more frames if needed.
      for (let frames = 0; frames < 3 && secondRemaining === undefined; frames += 1) {
        runFrame()
        await sleep(100)
      }
      expect(secondRemaining).to.be.a('number')
      expect(secondRemaining).to.be.greaterThanOrEqual(0)
      expect(secondRemaining).to.be.lessThanOrEqual(5)
      // The period opened no later than the first callback, so its deadline is at most firstStart + 10.
      if (secondStart - firstStart < 10) {
        expect(secondRemaining).to.be.lessThanOrEqual(firstStart + 10 - secondStart + 0.01)
      }
    })

    it('lets promise continuations run between callbacks of one period', async () => {
      const log = []
      requestIdleCallback(() => {
        log.push('A')
        queueMicrotask(() => log.push('micro'))
      })
      requestIdleCallback(() => log.push('B'))
      // Only one frame is delivered: B must still run, because the 10ms period has budget left.
      runFrame()
      await sleep(100)
      expect(log).to.eql(['A', 'micro', 'B'])
    })

    it('runs the next callback in a separate task, after the whole microtask queue drains', async () => {
      const log = []
      requestIdleCallback(() => {
        log.push('A')
        // A chain of microtasks: a yield that is itself a microtask would let B in before the chain ends.
        let depth = 0
        const step = () => {
          depth += 1
          if (depth < 5) queueMicrotask(step)
          else log.push('chain-end')
        }
        queueMicrotask(step)
      })
      requestIdleCallback(() => log.push('B'))
      runFrame()
      await sleep(100)
      expect(log).to.eql(['A', 'chain-end', 'B'])
    })

    it('lets a promise continuation cancel the next callback before it runs', async () => {
      const ran = []
      const ids = {}
      requestIdleCallback(async () => {
        ran.push('A')
        await null
        cancelIdleCallback(ids.second)
      })
      ids.second = requestIdleCallback(() => ran.push('B'))
      requestIdleCallback(() => ran.push('C'))
      runFrame()
      await sleep(100)
      expect(ran).to.eql(['A', 'C'])
    })

    it('waits for the next frame when a request is made after the frame gate fired but before the period opens', async () => {
      const ran = []
      requestIdleCallback(() => ran.push('first'))
      runFrame()
      // The gate has fired and the period's task is queued: this request has not been through a paint yet.
      requestIdleCallback(() => ran.push('late'))
      await sleep(100)
      expect(ran).to.eql(['first'])

      runFrame()
      await sleep(100)
      expect(ran).to.eql(['first', 'late'])
    })

    it('cancels a request that is waiting for the next frame after the gate fired', async () => {
      let calls = 0
      requestIdleCallback(() => {})
      runFrame()
      const id = requestIdleCallback(() => calls++)
      cancelIdleCallback(id)
      await sleep(100)
      runFrame()
      await sleep(100)
      expect(calls).to.equal(0)
    })

    it('keeps running callbacks across slices until the 10ms period budget is used up', async () => {
      const total = 6
      const ran = []
      for (let i = 0; i < total; i += 1) {
        requestIdleCallback(() => {
          ran.push(i)
          busyWait(4)
        })
      }
      runFrame()
      await sleep(100)
      // 4ms each: roughly 2-3 fit in 10ms, and the rest wait for the next frame.
      expect(ran.length).to.be.greaterThanOrEqual(2)
      expect(ran.length).to.be.lessThan(total)

      for (let frames = 0; frames < total && ran.length < total; frames += 1) {
        runFrame()
        await sleep(100)
      }
      expect(ran).to.eql([0, 1, 2, 3, 4, 5])
    })

    it('defers the remaining callbacks to the next frame once the deadline has passed', async () => {
      const ran = []
      requestIdleCallback(() => {
        ran.push('first')
        busyWait(12)
      })
      requestIdleCallback(() => ran.push('second'))
      runFrame()
      await sleep(100)
      expect(ran).to.eql(['first'])

      runFrame()
      await sleep(100)
      expect(ran).to.eql(['first', 'second'])
    })

    it('does not run a callback scheduled from inside a running callback in the same task', async () => {
      const log = []
      requestIdleCallback(() => {
        log.push('outer')
        requestIdleCallback(() => log.push('inner'))
        queueMicrotask(() => log.push('micro'))
      })
      runFrame()
      await sleep(100)
      // The short outer callback's request waits for the next frame.
      expect(log).to.eql(['outer', 'micro'])
      runFrame()
      await sleep(100)
      // The microtask runs when the outer callback's task ends; the inner callback must come after it.
      expect(log).to.eql(['outer', 'micro', 'inner'])
    })

    it('waits for the next frame to run a callback scheduled from a short callback', async () => {
      const ran = []
      requestIdleCallback(() => {
        ran.push('outer')
        requestIdleCallback(() => ran.push('inner'))
      })
      runFrame()
      // The period still has budget, but the outer callback finished early, so the spec's rule applies.
      await sleep(100)
      expect(ran).to.eql(['outer'])

      runFrame()
      await sleep(100)
      expect(ran).to.eql(['outer', 'inner'])
    })

    describe('a callback that uses its whole slice and requeues', () => {
      // Whether the continuation fits in the 10ms period depends on how fast the machine runs the next task, and a
      // continuation that misses the period waits for a frame that never comes here. So retry a few times: the
      // behavior is proven by any one attempt where the continuation runs without a further frame.
      const continuesInSamePeriod = async exhaust => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          let continued = false
          requestIdleCallback(deadline => {
            exhaust(deadline)
            requestIdleCallback(() => {
              continued = true
            })
          })
          runFrame()
          await sleep(50)
          if (continued) return true
          // Flush the missed attempt: its continuation runs in the next frame.
          runFrame()
          await sleep(50)
        }
        return false
      }

      it('may run the continuation later in the same period, when it looped on timeRemaining()', async () => {
        const continued = await continuesInSamePeriod(deadline => {
          while (deadline.timeRemaining() > 0) {
            // spin
          }
        })
        expect(continued).to.equal(true)
      })

      it('may run the continuation later in the same period, when it ran past its slice', async () => {
        const continued = await continuesInSamePeriod(() => busyWait(6))
        expect(continued).to.equal(true)
      })
    })

    it('runs a cheap self-rescheduling callback about once per frame', async () => {
      const frames = 5
      let count = 0
      let polling = true
      const poll = () =>
        requestIdleCallback(() => {
          count += 1
          if (polling) poll()
        })
      try {
        poll()
        for (let i = 0; i < frames; i += 1) {
          runFrame()
          await sleep(20)
        }
      } finally {
        polling = false
      }
      expect(count).to.be.greaterThanOrEqual(1)
      expect(count).to.be.lessThanOrEqual(frames + 1)
    })

    it('waits for the next frame when a request is made outside any callback while a period is running', async () => {
      const ran = []
      requestIdleCallback(() => {
        ran.push('A')
        // Runs after A's task ends and before the next slice, while the period is still open for B.
        queueMicrotask(() => requestIdleCallback(() => ran.push('C')))
      })
      requestIdleCallback(() => ran.push('B'))
      runFrame()
      await sleep(100)
      expect(ran).to.not.include('C')

      for (let frames = 0; frames < 3 && ran.length < 3; frames += 1) {
        runFrame()
        await sleep(100)
      }
      expect(ran).to.eql(['A', 'B', 'C'])
    })

    it('still defers the request of a short callback that throws, and does not strand later callbacks', async () => {
      const savedOnError = window.onerror
      const errors = []
      window.onerror = (message, source, line, column, error) => {
        errors.push(error?.message ?? String(message))
        return true
      }
      try {
        const ran = []
        requestIdleCallback(() => {
          requestIdleCallback(() => ran.push('again'))
          throw new Error('after requesting')
        })
        requestIdleCallback(() => ran.push('B'))
        runFrame()
        await sleep(100)
        expect(errors).to.eql(['after requesting'])
        expect(ran).to.not.include('again')

        for (let frames = 0; frames < 3 && ran.length < 2; frames += 1) {
          runFrame()
          await sleep(100)
        }
        expect(ran).to.eql(['B', 'again'])
        expect(errors).to.have.lengthOf(1)
      } finally {
        window.onerror = savedOnError
      }
    })

    it('runs a callback scheduled from inside a callback exactly once and after its siblings', async () => {
      const ran = []
      requestIdleCallback(() => {
        ran.push('outer')
        requestIdleCallback(() => ran.push('inner'))
      })
      requestIdleCallback(() => ran.push('sibling'))
      runFrame()
      await sleep(100)
      runFrame()
      await sleep(100)
      expect(ran).to.eql(['outer', 'sibling', 'inner'])
    })

    it('does not strand later callbacks when a callback throws', async () => {
      const savedOnError = window.onerror
      const errors = []
      // Mocha fails the running test on an uncaught error via window.onerror; record it instead.
      window.onerror = (message, source, line, column, error) => {
        errors.push(error?.message ?? String(message))
        return true
      }
      try {
        const ran = []
        requestIdleCallback(() => {
          throw new Error('callback failure')
        })
        requestIdleCallback(() => ran.push('second'))
        requestIdleCallback(() => ran.push('third'))
        runFrame()
        await sleep(100)
        expect(errors).to.have.lengthOf(1)
        expect(errors[0]).to.contain('callback failure')

        runFrame()
        await sleep(100)
        expect(ran).to.eql(['second', 'third'])
        expect(errors).to.have.lengthOf(1)
      } finally {
        window.onerror = savedOnError
      }
    })

    it('does not strand later callbacks when a callback in a later task of the period throws', async () => {
      const savedOnError = window.onerror
      const errors = []
      window.onerror = (message, source, line, column, error) => {
        errors.push(error?.message ?? String(message))
        return true
      }
      try {
        const ran = []
        requestIdleCallback(() => ran.push('first'))
        requestIdleCallback(() => {
          throw new Error('later failure')
        })
        requestIdleCallback(() => ran.push('third'))
        // One frame only: 'third' runs in a task after the one that threw.
        runFrame()
        await sleep(100)
        expect(errors).to.eql(['later failure'])
        expect(ran).to.eql(['first', 'third'])
      } finally {
        window.onerror = savedOnError
      }
    })

    it('does not run every queued callback in one period when each takes a while', async () => {
      const total = 8
      const ran = []
      for (let i = 0; i < total; i += 1) {
        requestIdleCallback(() => {
          ran.push(i)
          busyWait(3)
        })
      }
      runFrame()
      await sleep(100)
      // The first callback always runs, but 8 x 3ms cannot fit in one 10ms period.
      expect(ran.length).to.be.greaterThanOrEqual(1)
      expect(ran.length).to.be.lessThan(total)

      // Nothing is lost: each further frame lets more callbacks run, still in order.
      for (let frames = 0; frames < total && ran.length < total; frames += 1) {
        runFrame()
        await sleep(100)
      }
      expect(ran).to.eql([0, 1, 2, 3, 4, 5, 6, 7])
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
      await sleep(300)
      expect(received).to.eql([false])
    })

    it('spaces out periods of a self-rescheduling queue so a hidden tab does not spin', async () => {
      stubVisibility('hidden')
      const stamps = []
      let running = true
      const loop = () =>
        requestIdleCallback(() => {
          stamps.push(performance.now())
          if (running) loop()
        })
      loop()
      await sleep(600)
      running = false
      await sleep(250)
      const gaps = stamps
        .slice(1)
        .map((t, i) => t - stamps[i])
        .filter(gap => gap > 5)
      expect(gaps.length).to.be.greaterThan(1)
      expect(Math.min(...gaps)).to.be.greaterThan(80)
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

  describe('animation frames that never arrive', () => {
    it('runs a request without a timeout through a task fallback while the document stays visible', async () => {
      const received = []
      requestIdleCallback(deadline => received.push(deadline.didTimeout))
      await sleep(100)
      expect(received).to.eql([])
      await sleep(400)
      expect(received).to.eql([false])
    })

    it('does not open a second period when the frame arrives after the fallback', async () => {
      let calls = 0
      requestIdleCallback(() => calls++)
      await sleep(500)
      expect(calls).to.equal(1)
      // The stale frame was cancelled by the fallback, and delivering it anyway must not run anything again.
      expect(cancelledFrames.size).to.equal(1)
      runAllIssuedFrames()
      await sleep(100)
      expect(calls).to.equal(1)
    })

    it('does not run the fallback after the frame arrived first', async () => {
      let calls = 0
      requestIdleCallback(() => calls++)
      runFrame()
      await sleep(500)
      expect(calls).to.equal(1)
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
