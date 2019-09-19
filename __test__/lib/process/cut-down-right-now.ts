import { ProcessException, SafeProcssWrap, EventEmitter } from '../../../src';
export default class CustomService extends EventEmitter {
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
    await new Promise(resolve => setTimeout(resolve, 5000));
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