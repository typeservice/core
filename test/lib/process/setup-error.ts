import { ProcessException, SafeProcssWrap, EventEmitter } from '../../../src';
class CustomService extends EventEmitter {
  public readonly listen = SafeProcssWrap(this);

  constructor() {
    super();
    this.on('setup', this.setup.bind(this));
  }

  async setup() {
    throw new ProcessException('setup error', 'ESETUP');
  }
}

const frameworker = new CustomService();
frameworker.listen(async (e) => {
  process.send({
    key: 'exiterror',
    value: e.message
  })
});