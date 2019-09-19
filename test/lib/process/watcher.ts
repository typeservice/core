import * as path from 'path';
import * as childprocess from 'child_process';

type MessageType = { key: string, value: any };
type ProcessWatcherOptions = {
  [key: string]: (value: any) => void;
}

type ProcessWatcherCallback = (ls?: childprocess.ChildProcess) => ProcessWatcherOptions;

export default function ProcessWatcher(file: string, callback: ProcessWatcherCallback, done?: (code: number | null, signal: string | null) => void) {
  const ls = childprocess.fork(file, [], { execPath: path.resolve(__dirname, '../../../node_modules/.bin/ts-node') });
  const options = callback(ls);
  ls.on('message', (data: MessageType) => {
    if (options[data.key]) options[data.key](data.value);
  });
  done && ls.on('exit', done);
}