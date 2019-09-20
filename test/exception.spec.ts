import { HttpException, ProcessException, IPCException } from '../src';

describe('Exception unit test', () => {
  test('HttpException', () => {
    const err = new HttpException('test error', 300);
    expect(err.name).toBe('HttpException');
    expect(err.message).toBe('test error');
    expect(err.code).toEqual(300);
  })

  test('ProcessException', () => {
    const err = new ProcessException('test error', 'EERROR');
    expect(err.name).toBe('ProcessException');
    expect(err.message).toBe('test error');
    expect(err.code).toBe('EERROR');
  })

  test('IPCException', () => {
    const err = new IPCException('test error', 300);
    expect(err.name).toBe('IPCException');
    expect(err.message).toBe('test error');
    expect(err.code).toEqual(300);
  })
})