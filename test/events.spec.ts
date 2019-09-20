import { EventEmitter } from '../src';

describe('Events unit test', () => {
  test('static methods', () => {
    expect(EventEmitter.Methods).toEqual([
      'on',
      'off',
      'addListener',
      'removeListener',
      'prependListener',
      'removeAllListeners',
      'emit',
      'eventNames',
      'listenerCount',
      'listeners'
    ]);
  })
  test('add event listeners', () => {
    const e = new EventEmitter();
    e.on('abc', async () => {});
    e.on('def', async () => {});
    expect(e.eventNames()).toEqual(['abc', 'def']);
    expect(e.listenerCount('abc')).toEqual(1);
    expect(e.listenerCount('def')).toEqual(1);
    e.on('def', async () => {});
    expect(e.listenerCount('def')).toEqual(2);
  })

  test('remove event listeners', () => {
    const e = new EventEmitter();
    const c = async () => {};
    e.on('abc', async () => {});
    e.on('def', c);
    e.off('def', c);
    expect(e.eventNames()).toEqual(['abc']);
    expect(e.listenerCount('def')).toEqual(0);
  })

  test('remove all listener', () => {
    const e = new EventEmitter();
    e.on('abc', async () => {});
    e.on('def', async () => {});
    e.removeAllListeners('def');
    expect(e.eventNames()).toEqual(['abc']);
  })

  test('emit', async () => {
    let a: number[] = [];
    const b = (x:number) => async () => a.push(x);
    const e = new EventEmitter();
    e.on('abc', b(2));
    e.on('abc', b(6));
    e.on('abc', b(1));
    e.on('abc', b(9));
    await e.emit('abc');
    expect(a).toEqual([2,6,1,9]);
  })

  test('emit empty', async () => {
    const e = new EventEmitter();
    await e.emit('abc');
  })

  test('sync', async () => {
    let i = 0;
    const b = (x:number) => async () => i = i + x;
    const e = new EventEmitter();
    e.on('abc', b(2));
    e.on('abc', b(6));
    e.on('abc', b(1));
    e.on('abc', b(9));
    await e.sync('abc');
    expect(i).toEqual(18);
  })

  test('sync empty', async () => {
    const e = new EventEmitter();
    await e.sync('abc');
  })

  test('lookup', async () => {
    let a: number[] = [];
    const b = (x:number) => async () => a.push(x);
    const e = new EventEmitter();
    e.on('abc', b(2));
    e.on('abc', b(6));
    e.on('abc', b(1));
    e.on('abc', b(9));
    await e.lookup('abc');
    expect(a).toEqual([9,1,6,2]);
  })

  test('loopup empty', async () => {
    const e = new EventEmitter();
    await e.lookup('abc');
  })
})