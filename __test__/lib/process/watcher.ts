import * as childprocess from 'child_process';

type MessageType = { key: string, value: any };
type ProcessWatcherOptions = {
  [key: string]: (value: any) => void;
}

export default function ProcessWatcher(file: string, options: ProcessWatcherOptions, done?: (code: number | null, signal: string | null) => void) {
  const ls = childprocess.fork(file, [], { cwd: process.cwd() });
  ls.on('message', (data: MessageType) => {
    if (options[data.key]) options[data.key](data.value);
  });
  done && ls.on('exit', done);
}