import * as http from 'http';
import { WorkerFactory } from '../../../src';
export default class HttpFrameworker extends WorkerFactory {
  private readonly server: http.Server;
  constructor() {
    super();
    this.on('setup', () => new Promise(resolve => {
      const server = http.createServer((req, res) => res.end('ok'));
      Object.defineProperty(this, 'server', { value: server });
      server.listen(8080, resolve);
    }));
    this.on('exit', async () => this.server.close());
    this.messager.method('abc', (data) => data);
  }

  stop() {
    this.server.close();
  }
}