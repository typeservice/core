import * as fs from 'fs';

export enum SETUPTYPES {
  MASTER,
  WORKER,
  AGENT,
}

export interface Logger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
}

export function resolve(file: string) {
  let _file = file.endsWith('.js') ? file : file + '.js';
  if (fs.existsSync(_file)) return _file;
  _file = file.endsWith('.ts') ? file : file + '.ts';
  if (fs.existsSync(_file)) return _file;
  throw new Error('cannot find file path:' + file);
}