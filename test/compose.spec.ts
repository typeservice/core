import { Compose, ComposeMiddleware, ComposedMiddleware, ComposeNextCallback } from '../src';
import * as assert from 'assert';

function wait (ms:number) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1))
}

function isPromise (x: Promise<any>) {
  return x && typeof x.then === 'function'
}


describe('Compose test unit', () => {
  test('should work', async () => {
    const arr: number[] = []
    const stack: ComposeMiddleware[] = []

    stack.push(async (context: any, next: ComposeNextCallback) => {
      arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      arr.push(6)
    })

    stack.push(async (context: any, next: ComposeNextCallback) => {
      arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      arr.push(5)
    })

    stack.push(async (context: any, next: ComposeNextCallback) => {
      arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      arr.push(4)
    })

    await Compose(stack)({})
    expect(arr).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]))
  })


  test('should be able to be called twice', async () => {
    var stack: ComposeMiddleware[] = []

    stack.push(async (context: any, next: ComposeNextCallback) => {
      context.arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(6)
    })

    stack.push(async (context: any, next: ComposeNextCallback) => {
      context.arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(5)
    })

    stack.push(async (context: any, next: ComposeNextCallback) => {
      context.arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(4)
    })

    const fn = Compose(stack)
    const ctx1: {arr: number[]} = { arr: [] }
    const ctx2: {arr: number[]} = { arr: [] }
    const out = [1, 2, 3, 4, 5, 6]

    await fn(ctx1).then(() => {
      assert.deepEqual(out, ctx1.arr)
      return fn(ctx2)
    }).then(() => {
      assert.deepEqual(out, ctx2.arr)
    })
  })

  test('should only accept an array', () => {
    let err: Error
    try {
      expect(Compose()).toThrow()
    } catch (e) {
      err = e
    }
    return expect(err).toBeInstanceOf(TypeError)
  })

  test('should create next functions that return a Promise', () => {
    const stack: ComposeMiddleware[] = []
    const arr: any[] = []
    for (let i = 0; i < 5; i++) {
      stack.push((context, next) => {
        arr.push(next())
      })
    }

    Compose(stack)({})

    for (let next of arr) {
      assert(isPromise(next), 'one of the functions next is not a Promise')
    }
  })

  test('should work with 0 middleware', function () {
    return Compose([])({})
  })

  test('should work when yielding at the end of the stack', async () => {
    var stack = []
    var called = false

    stack.push(async (ctx: any, next: ComposeNextCallback) => {
      await next()
      called = true
    })

    await Compose(stack)({});
    assert(called);
  })

  test('should reject on errors in middleware', async () => {
    var stack = []

    stack.push(() => { throw new Error() })

    await Compose(stack)({})
      .then(function () {
        throw new Error('promise was not rejected')
      })
      .catch(function (e) {
        expect(e).toBeInstanceOf(Error)
      })
  })

  test('should keep the context', () => {
    const ctx = {}

    const stack: ComposeMiddleware[] = []

    stack.push(async (ctx2: any, next: ComposeNextCallback) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    stack.push(async (ctx2: any, next: ComposeNextCallback) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    stack.push(async (ctx2: any, next: ComposeNextCallback) => {
      await next()
      expect(ctx2).toEqual(ctx)
    })

    return Compose(stack)(ctx)
  })

  test('should catch downstream errors', async () => {
    const arr: number[] = []
    const stack: ComposeMiddleware[] = []

    stack.push(async (ctx: any, next: ComposeNextCallback) => {
      arr.push(1)
      try {
        arr.push(6)
        await next()
        arr.push(7)
      } catch (err) {
        arr.push(2)
      }
      arr.push(3)
    })

    stack.push(async  (ctx: any, next: ComposeNextCallback) => {
      arr.push(4)
      throw new Error()
    })

    await Compose(stack)({})
    expect(arr).toEqual([1, 6, 4, 2, 3])
  })

  test('should compose w/ next', async () => {
    let called = false

    await Compose([])({}, async () => {
      called = true
    }).then(function () {
      assert(called)
    })
  })

  test('should handle errors in wrapped non-async functions', async () => {
    const stack: ComposeMiddleware[] = []

    stack.push(function () {
      throw new Error()
    })

    await Compose(stack)({}).then(function () {
      throw new Error('promise was not rejected')
    }).catch(function (e) {
      expect(e).toBeInstanceOf(Error)
    })
  })

  test('should compose w/ other compositions', async () => {
    var called: number[] = []

    await Compose([
      Compose([
        (ctx: any, next: ComposeNextCallback) => {
          called.push(1)
          return next()
        },
        (ctx: any, next: ComposeNextCallback) => {
          called.push(2)
          return next()
        }
      ]),
      (ctx: any, next: ComposeNextCallback) => {
        called.push(3)
        return next()
      }
    ])({}).then(() => assert.deepEqual(called, [1, 2, 3]))
  })

  test('should throw if next() is called multiple times', async () => {
    await Compose([
      async (ctx: any, next: ComposeNextCallback) => {
        await next()
        await next()
      }
    ])({}).then(() => {
      throw new Error('boom')
    }, (err) => {
      assert(/multiple times/.test(err.message))
    })
  })

  test('should return a valid middleware', async () => {
    let val = 0
    await Compose([
      Compose([
        (ctx: any, next: ComposeNextCallback) => {
          val++
          return next()
        },
        (ctx: any, next: ComposeNextCallback) => {
          val++
          return next()
        }
      ]),
      (ctx: any, next: ComposeNextCallback) => {
        val++
        return next()
      }
    ])({}).then(function () {
      expect(val).toEqual(3)
    })
  })

  test('should return last return value', async () => {
    const stack: ComposeMiddleware[] = []

    stack.push(async (context: any, next: ComposeNextCallback) => {
      var val = await next()
      expect(val).toEqual(2)
      return 1
    })

    stack.push(async (context: any, next: ComposeNextCallback) => {
      const val = await next()
      expect(val).toEqual(0)
      return 2
    })

    const next = async () => 0
    await Compose(stack)({}, next).then(function (val: any) {
      expect(val).toEqual(1)
    })
  })

  test('should not affect the original middleware array', () => {
    const middleware: ComposeMiddleware[] = []
    const fn1 = (ctx: any, next: ComposeNextCallback) => {
      return next()
    }
    middleware.push(fn1)

    for (const fn of middleware) {
      assert.equal(fn, fn1)
    }

    Compose(middleware)

    for (const fn of middleware) {
      assert.equal(fn, fn1)
    }
  })

  test('should not get stuck on the passed in next', async () => {
    const middleware = [(ctx: any, next: ComposeNextCallback) => {
      ctx.middleware++
      return next()
    }]
    const ctx = {
      middleware: 0,
      next: 0
    }

    await Compose(middleware)(ctx, (ctx: any, next: ComposeNextCallback) => {
      ctx.next++
      return next()
    }).then(() => {
      expect(ctx).toEqual({ middleware: 1, next: 1 })
    })
  })

  test('Normalize test', done => {
    const context = {
      a: 1, b: 2
    }
    const arr: ComposeMiddleware[] = [];
    arr.push(async (ctx: typeof context, next: ComposeNextCallback) => {
      ctx.a = ctx.b + 3 + ctx.a;
      await next();
    });
    Compose<typeof context>(arr)(context).then(() => {
      expect(context.a).toEqual(6);
    }).then(done);
  });

  test('Error throw test', done => {
    const context = {
      a: 1, b: 2
    }
    const arr: ComposeMiddleware[] = [];
    arr.push(async (ctx: typeof context, next: ComposeNextCallback) => {
      throw new Error('test error');
    });
    arr.push(async (ctx: typeof context, next: ComposeNextCallback) => {
      ctx.a = ctx.b + 3 + ctx.a;
      await next();
    });
    Compose<typeof context>(arr)(context)
      .catch(e => expect(e.message).toBe('test error'))
      .then(() => expect(context.a).toEqual(1))
      .then(done);
  })
})