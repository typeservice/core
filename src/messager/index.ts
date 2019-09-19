import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as uuid from 'uuid';
import * as cluster from 'cluster';
import * as childProcess from 'child_process';
import * as Timer from '../timer';
import { Noder } from './node';
import { SETUPTYPES, IPCException, resolve as PathResolve } from '../shared';

let runtime = path.resolve(__dirname, '../agent/runtime.js');
if (!fs.existsSync(runtime)) runtime = path.resolve(__dirname, '../agent/runtime.ts');

interface MessageTransportType {
  id: number,
  to: string | number,
  fm: number,
  ty: 0 | 1, // 0 request 1 response
  0?: {
    m: string,
    p: any,
    r: boolean,
  },
  1?: {
    s: number,
    m: any
  }
}

interface MessageSendOptions extends Omit<MessageTransportType, 'id'> {
  id?: number,
}

type MessageHandlerType = (data: any, socket?: net.Socket) => void | Promise<any>;

class Messager {

  private _id: number = 1;
  private _pid: number = process.pid;
  private _kind: SETUPTYPES;
  private _mapper:        Map<string, Noder> = new Map();
  private _noders:        Map<number, Noder> = new Map();
  private _handlers:      Map<string, MessageHandlerType> = new Map();
  private _callbacks:     Map<number, (error: IPCException, data?: any) => void> = new Map();
  private _agentBuilders: Map<string, (err?: string) => void> = new Map();
  public readonly weight: 10 | 20 | 30 | 31;

  constructor(_kind: SETUPTYPES) {
    this._kind = _kind;
    process.on('message', this._onMessage.bind(this));
    switch (_kind) {
      case SETUPTYPES.MASTER: this.weight = 10; break;
      case SETUPTYPES.AGENT: this.weight = 20; break;
      case SETUPTYPES.WORKER:
        if (cluster.isMaster) {
          this.weight = 30;
        } else if (cluster.isWorker) {
          this.weight = 31;
        }
        break;
    }
    if (this.isMessageMaster) {
      this.method('-', data => this.destroy(data.name));
      this.method('+', data => this.create(data.name, data.file, ...data.args));
      this.method('%', (data: { hash: string, error?: string }) => {
        if (this._agentBuilders.has(data.hash)) {
          this._agentBuilders.get(data.hash)(data.error);
        }
      });
    }
  }

  get kind() {
    return this._kind;
  }

  get isMessageMaster() {
    return this.weight === 10 || this.weight === 30;
  }

  get nodes() {
    return this._noders.size;
  }

  get channels() {
    return this._mapper.size;
  }

  method(name: string, fn: MessageHandlerType) {
    this._handlers.set(name, fn);
  }

  private id() {
    if (this._id === Number.MAX_SAFE_INTEGER) this._id = 1;
    return this._id++;
  }

  /**
   * Create a new agent by {name}
   * @param name {string} agent name
   * @param file {string} agent runtime file
   * @param args {any[]} agent runtime constructor arguments
   */
  public async create(name: string, file: string, ...paramaters: any[]) {
    if (!this.isMessageMaster) return await this.invoke('master', '+', { name, file, args: paramaters });
    return await new Promise((resolve, reject) => {
      const hash = uuid.v4();
      const args = process.argv.slice(2);
      file = PathResolve(file);
      args.push(
        '--Agent.Script=' + file, 
        '--Agent.Arguments=' + JSON.stringify(paramaters || []), 
        '--Agent.Token=' + hash
      );
      this._agentBuilders.set(hash, (err?: string) => {
        this._agentBuilders.delete(hash);
        if (err) return reject(new IPCException(err, 502));
        resolve();
      });
      const argvs: childProcess.ForkOptions = {
        cwd: process.cwd(),
        env: Object.create(process.env),
        stdio: 'inherit',
        execArgv: process.execArgv.slice(0),
      }
      if (file.endsWith('.ts')) {
        argvs.execPath = path.resolve(process.cwd(), './node_modules/.bin/ts-node');
      }
      const agent = childProcess.fork(runtime, args, argvs);
      const node = new Noder(agent, SETUPTYPES.AGENT);
      this.register(node, name);
    });
  }

  /**
   * Destroy the agent by {name}
   * @param name {string} agent name
   */
  public async destroy(name: string) {
    if (!this.isMessageMaster) return await this.invoke('master', '-', { name });
    return await new Promise(resolve => {
      if (!this._mapper.has(name)) return resolve();
      const node = this._mapper.get(name);
      node.destroy(resolve);
      process.kill(node.pid, 'SIGTERM');
    });
  }

  public register(node: Noder, alias?: string) {
    if (!this.isMessageMaster) return;
    this._noders.set(node.pid, node);
    if (alias) this._mapper.set(alias, node);
    node.onMessage(this._onMessage.bind(this));
    node.onClose(() => this.unregister(alias || node.pid));
  }

  public unregister(pid: number | string) {
    if (!this.isMessageMaster) return;
    if (typeof pid === 'string') {
      const _pid = pid;
      const node = this._mapper.has(pid) ? this._mapper.get(pid) : null;
      pid = 0;
      if (node) {
        pid = node.pid;
        this._mapper.delete(_pid);
      }
    } else {
      
    }
    if (pid) {
      if (this._noders.has(pid)) this._noders.delete(pid);
    }
  }

  private exec(data: MessageTransportType, socket?: net.Socket) {
    const ty = data.ty;
    if (ty === 0) {
      const chunk = data[0];
      const method = chunk.m;
      const paramter = chunk.p;
      const reply = chunk.r;
      if (this._handlers.has(method)) {
        const handler = this._handlers.get(method);
        if (typeof handler !== 'function') return;
        Promise.resolve(handler(paramter, socket))
        .then(result => {
          if (reply) {
            this._send({
              id: data.id,
              to: data.fm,
              fm: this._pid,
              ty: 1,
              1: {
                s: 200,
                m: result
              }
            })
          }
        })
        .catch((e: IPCException) => {
          if (reply) {
            this._send({
              id: data.id,
              to: data.fm,
              fm: this._pid,
              ty: 1,
              1: {
                s: e.code || 500,
                m: e.message
              }
            })
          }
        })
      } else {
        if (reply) {
          this._send({
            id: data.id,
            to: data.fm,
            fm: this._pid,
            ty: 1,
            1: {
              s: 404,
              m: 'cannot find the method of ' + method
            }
          })
        }
      }
    } else if (ty === 1) {
      const chunk = data[1];
      const id = Number(data.id);
      if (this._callbacks.has(id)) {
        const handler = this._callbacks.get(id);
        if (chunk.s === 200) {
          handler(null, chunk.m);
        } else {
          handler(new IPCException(chunk.m, chunk.s));
        }
      }
    }
  }

  private _onMessage(data: MessageTransportType, socket?: net.Socket) {
    if (this.isMessageMaster) {
      if (data.to === 'master' || data.to === this._pid) {
        this.exec(data, socket);
      } else {
        this._send(data, socket);
      }
    } else {
      this.exec(data, socket);
    }
  }

  private _send(options: MessageSendOptions, socket?: net.Socket) {
    options.id = options.id || this.id();
    if (this.isMessageMaster) {
      if (options.to === 'master' || options.to === this._pid) {
        options.to = this._pid;
        process.nextTick(() => this._onMessage(options as MessageTransportType, socket));
        return options.id;
      }
      let node: Noder;

      /**
       * transform `to` to noder
       * first check noder exists
       * then send it by this noder
       */
      if (typeof options.to === 'string') {
        if (!this._mapper.has(options.to)) throw new IPCException('cannot find the alias name of ' + options.to, 404);
        node = this._mapper.get(options.to);
      } else {
        if (!this._noders.has(options.to)) throw new IPCException('cannot find the process id of ' + options.to, 404);
        node = this._noders.get(options.to);
      }

      // send it.
      options.to = node.pid;
      node.send(options as MessageTransportType, socket);
    } else {
      if (options.to === this._pid) {
        process.nextTick(() => this._onMessage(options as MessageTransportType, socket));
        return options.id;
      }
      // send it to master
      process.send(options, socket);
    }
    return options.id;
  }

  public send(to: string, method: string, paramater?: any) {
    return this._send({
      to,
      fm: this._pid,
      ty: 0,
      0: {
        m: method,
        p: paramater,
        r: false
      }
    });
  }

  public async invoke<T = any>(to: string | number, method: string, paramater?: any, timeout?: number) {
    const id = await Promise.resolve(this._send({
      to,
      fm: this._pid,
      ty: 0,
      0: {
        m: method,
        p: paramater,
        r: true
      }
    }));
    return await new Promise<T>((resolve, reject) => {
      const timer = Timer.startTimeout(() => {
        this._callbacks.delete(id);
        throw new IPCException(`invoke method<${method}> from ${to} timeout`, 408);
      }, timeout || 20000);
      this._callbacks.set(id, (error, data) => {
        Timer.stopTimeout(timer);
        this._callbacks.delete(id);
        if (error) return reject(error);
        resolve(data);
      });
    });
  }
}

export {
  Messager,
  MessageHandlerType,
  MessageTransportType
}