import { SafeProcssWrap } from '../process';
import { SETUPTYPES, EventEmitter, Logger } from '../shared';
import { Messager } from '../messager';

class WorkerFactory extends EventEmitter {
  public readonly logger: Logger;
  public readonly messager = new Messager(SETUPTYPES.WORKER);
  public readonly listen = SafeProcssWrap(this);

  constructor(logger?: Logger) {
    super();
    this.logger = logger || console;
  }
}

export {
  WorkerFactory,
}