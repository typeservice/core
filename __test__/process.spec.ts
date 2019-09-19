import * as path from 'path';
import ProcessWatcher from './lib/process/watcher';

describe('process start', () => {
  test('cutdonw right now', done => {
    ProcessWatcher(path.resolve(__dirname, './lib/process/cut-down-right-now.ts'), {
      setup(value) { expect(value).toBe(1); },
      exit(value) { expect(value).toBe(2); },
    }, done);
  });
});