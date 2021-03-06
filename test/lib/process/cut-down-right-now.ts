import { ProcessException, SafeProcssWrap, EventEmitter } from '../../../src';
class CustomService extends EventEmitter {
  public readonly listen = SafeProcssWrap(this);

  constructor() {
    super();
    this.on('error', this.error.bind(this));
    this.on('exit', this.exit.bind(this));
    this.on('setup', this.setup.bind(this));
  }
  
  error(e: ProcessException, name?: string){
    console.error('error', e, name);
  }

  async exit() {
    process.send({
      key: 'exit',
      value: 2
    })
  }

  async setup() {
    process.send({
      key: 'setup',
      value: 1
    })
  }
}

const pro = new CustomService();
pro.listen();