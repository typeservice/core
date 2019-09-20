import * as path from 'path';
import ProcessWatcher from './lib/process/watcher';
import { EventEmitter, SafeProcssWrap } from '../src';

function doneSure(done: Function, timeout?: number) {
  return () => setTimeout(done, timeout || 300);
}

describe('Test the lifecycle function of the underlying process', () => {
  test('Process no behavior ends', done => {
    const file = path.resolve(__dirname, './lib/process/cut-down-right-now.ts');
    ProcessWatcher(file, ls => {
      return {
        setup(value) { expect(value).toBe(1); },
        exit(value) { expect(value).toBe(2); },
      }
    }, doneSure(done));
  });

  test('End of process delay', done => {
    const file = path.resolve(__dirname, './lib/process/cut-down-with-timer.ts');
    ProcessWatcher(file, ls => {
      return {
        setup(value) { 
          expect(value).toBe(1); 
          setTimeout(() => ls.kill('SIGTERM'), 1000);
        },
        exit(value) { expect(value).toBe(2); },
      }
    }, doneSure(done));
  });

  test('Process capture error', done => {
    const file = path.resolve(__dirname, './lib/process/process-error.ts');
    ProcessWatcher(file, ls => {
      return {
        error(value) {
          expect(value).toBe('ESETUP:setup error');
        }
      }
    }, doneSure(done));
  });

  test('Process exit timeout', done => {
    const file = path.resolve(__dirname, './lib/process/process-exit-timeout.ts');
    ProcessWatcher(file, ls => {
      return {
        error(value) {
          expect(value).toBe('EEXIT_TIMEOUT:Process on exit timeout:1000');
        }
      }
    }, doneSure(done));
  })

  test('Process setup error event', done => {
    const file = path.resolve(__dirname, './lib/process/setup-error.ts');
    ProcessWatcher(file, ls => {
      return {
        exiterror(value) {
          expect(value).toBe('setup error');
        }
      }
    }, doneSure(done));
  })

  test('Process exit timeout', done => {
    const file = path.resolve(__dirname, './lib/process/timeout.ts');
    ProcessWatcher(file, ls => {
      return {
        timeout(value) {
          expect(value).toBe('Process on exit timeout:3000');
        }
      }
    }, doneSure(done));
  }, 10000)
});