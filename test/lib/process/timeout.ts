import { SafeProcssWrap, EventEmitter, Timer } from '../../../src';
class CustomService extends EventEmitter {
  public readonly listen = SafeProcssWrap(this, 3000);

  constructor() {
    super();
    this.on('exit', this.exit.bind(this));
    this.on('message', async e => {
      process.send({
        key: 'timeout',
        value: e.message
      })
    })
  }

  async exit() {
    await new Promise(resolve => Timer.startTimeout(resolve, 5000));
  }
}

const frameworker = new CustomService();
frameworker.listen();