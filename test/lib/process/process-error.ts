import { ProcessException, SafeProcssWrap, EventEmitter } from '../../../src';
export default class CustomService extends EventEmitter {
  public readonly listen = SafeProcssWrap(this);

  constructor() {
    super();
    this.on('error', this.error.bind(this));
    this.on('setup', this.setup.bind(this));
  }
  
  error(e: ProcessException, name?: string){
    process.send({
      key: 'error',
      value: name + ':' + e.message
    })
  }

  async setup() {
    throw new ProcessException('setup error', 'ESETUP');
  }
}

const pro = new CustomService();
pro.listen();