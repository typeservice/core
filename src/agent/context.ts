import * as net from 'net';
export class AgentContext<T = any, U = any> {
  public readonly data: T;
  public readonly socket: net.Socket;
  public body: U;
  constructor(data: T, socket?: net.Socket) {
    this.data = data;
    this.socket = socket;
  }
}