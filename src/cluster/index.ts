import * as os from 'os';
import * as path from 'path';
import * as cluster from 'cluster';
import { SafeProcssWrap } from '../process';
import { SETUPTYPES, EventEmitter, Logger } from '../shared';
import { Messager } from '../messager';
import { Noder } from '../messager/node';

type ClusterWorkerForkerOptions = {
  cwd?: string,
  refork?: boolean,
}

class ClusterFactory extends EventEmitter {
  private readonly logger: Logger;
  public readonly messager = new Messager(SETUPTYPES.MASTER);
  public readonly listen = SafeProcssWrap(this);

  constructor(max?: number, logger?: Logger) {
    super();
    max = max || os.cpus().length;
    this.logger = logger || console;
    this.on('setup', async () => {
      for (let i = 0; i < max; i++) {
        cluster.fork();
      }
    });
  }

  install(file: string, options?: ClusterWorkerForkerOptions) {
    options = options || {};
    file = path.resolve(options.cwd || process.cwd(), file);

    cluster.setupMaster({
      exec: file,
      stdio: [0, 1, 2, 'ipc'],
      execArgv: process.execArgv.slice(0),
      args: process.argv.slice(2),
    });

    cluster.on('fork', (worker) => {
      const node = new Noder(worker, SETUPTYPES.WORKER);
      this.messager.register(node);
    });

    return this;
  }
}

export {
  ClusterFactory,
  ClusterWorkerForkerOptions
}