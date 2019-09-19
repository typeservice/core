# @typeservice/core

![logo](https://github.com/typeservice/core/raw/master/logo/256.png)

A lightweight and pure service startup architecture. It provides the most direct access mode through a stable process lifecycle model. You can use it to build a variety of service frameworks.

It has the following features:

- Life cycle
- Process fault tolerance
- IPC communication protocol
- Dynamic Agent Process
- Cluster process support

It is written in [TYPESCRIPT](https://www.typescriptlang.org/) and provides a good coding experience. At the same time, it can be used to guard services through any form of process hosting, such as [pm2](https://www.npmjs.com/package/pm2), [forever](https://www.npmjs.com/package/forever).

## Installing

For the latest stable version:

```bash
$ npm install @typeservice/core
```

For our nightly builds:

```bash
$ npm install @typeservice/core@next
```

## Try it

```ts
import * as path from 'path';
import * as http from 'http';
import { WorkerFactory, IPCException, resolve } from '@typeservice/core';
class HttpFrameworker extends WorkerFactory {
  private readonly server: http.Server;
  constructor() {
    super();
    this.on('setup', () => new Promise(resolve => {
      const server = http.createServer((req, res) => res.end('ok'));
      Object.defineProperty(this, 'server', { value: server });
      console.log('start at 8080');
      server.listen(8080, resolve);
    }));
    this.on('exit', async () => this.server.close());
  }
}

const frameworker = new HttpFrameworker();

frameworker.listen()
  // use ipc communication protocol
  // get abc method result from master by args: { a: 1, b: 2 }
  .then(() => frameworker.messager.invoke('master', 'abc', { a: 1, b: 2 }))
  .then(data => console.log('result:', data))
  .catch((e: IPCException) => console.error(e.message))
  // create a new agent dynamicly
  .then(() => frameworker.messager.create('abc', path.resolve(__dirname, '../agent/abc'), 678))
  .then(() => new Promise(resolve => setTimeout(resolve, 5000)))
  .then(() => console.log('start invoke abc.test'))
  .then(() => frameworker.messager.invoke('abc', 'test', 666, 3000))
  .then((data) => console.log('end invoke abc.test', data))
  .catch(e => console.error(e))
```

### Worker

You can create a secure service by inheriting from the WorkerFactory.

```ts
class HttpFrameworker extends WorkerFactory {}
```

It has 3 lifecycle events:

- **setup** Process initial load event
- **exit** Process shutdown event
- **error** Process unexpected error event

> Here, we don't know how to use the worker to create a service architecture. You can use the [@typeservice/http](https://github.com/typeservice/http) project to find out how to create it.

### Agent

Maybe this is our focus. The dynamic agent process associates it with the worker service through the IPC communication protocol to form a communication closed loop based on the primary and secondary processes. It provides a series of annotations to help us build communication channels.

The notes are as follows:

- `@method` tag it is an IPC communication method
- `@initialize` initialization function
- `@terminate` process end function
- `@error` error handler (uncaught error or unexpected error)
- `@middleware` middleware

These methods are sufficient for us to use to form plugins to provide various functions, such as setting up task scheduling.

Here is a simple example:

```ts
import { AgentFactory, ipc, AgentContext } from '@typeservice/core';

export default class ABCAgent extends AgentFactory {
  private readonly _max: number;
  constructor(max: number) {
    super();
    this._max = max;
  }

  @ipc.method
  @ipc.middleware<AgentContext>(async (ctx, next) => {
    console.log('ctx', ctx);
    await next();
  })
  async test(ctx: AgentContext) {
    return ctx.data + this._max;
  }

  @ipc.initialize
  setup() {
    console.log('agent init')
  }

  @ipc.terminate
  exit() {
    console.log('agent exit')
  }
}
```

# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
