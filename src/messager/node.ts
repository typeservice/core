import { SETUPTYPES } from '../shared';
import * as net from 'net';
import * as childprocess from 'child_process';
import * as cluster from 'cluster';
import { MessageTransportType } from './index';
type Channel = NodeJS.Process | childprocess.ChildProcess | cluster.Worker;
class Noder {
  constructor(private channel: Channel, private _kind: SETUPTYPES) {}

  get pid() {
    switch (this._kind) {
      case SETUPTYPES.MASTER: return (this.channel as NodeJS.Process).pid;
      case SETUPTYPES.AGENT: return (this.channel as childprocess.ChildProcess).pid;
      case SETUPTYPES.WORKER: return (this.channel as cluster.Worker).process.pid;
    }
  }

  send(data: MessageTransportType, socket?: net.Socket) {
    switch (this._kind) {
      case SETUPTYPES.MASTER: return (this.channel as NodeJS.Process).send(data, socket);
      case SETUPTYPES.AGENT: return (this.channel as childprocess.ChildProcess).send(data, socket);
      case SETUPTYPES.WORKER: return (this.channel as cluster.Worker).send(data, socket);
    }
  }

  onMessage(fn: (data: MessageTransportType, socket?: net.Socket) => void) {
    switch (this._kind) {
      case SETUPTYPES.MASTER: return (this.channel as NodeJS.Process).on('message', fn);
      case SETUPTYPES.AGENT: return (this.channel as childprocess.ChildProcess).on('message', fn);
      case SETUPTYPES.WORKER: return (this.channel as cluster.Worker).on('message', fn);
    }
  }

  onClose(fn: any) {
    switch (this._kind) {
      case SETUPTYPES.AGENT: return (this.channel as childprocess.ChildProcess).on('exit', fn);
      case SETUPTYPES.WORKER: return (this.channel as cluster.Worker).on('exit', fn);
    }
  }

  destroy(resolve: () => void) {
    if (this._kind !== SETUPTYPES.AGENT) return;
    const channel = this.channel as childprocess.ChildProcess;
    channel.on('exit', resolve);
  }
}

export {
  Noder,
  Channel
}