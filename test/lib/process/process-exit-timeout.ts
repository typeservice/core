import { ProcessException, SafeProcssWrap, EventEmitter } from '../../../src';
class CustomService extends EventEmitter {
  public readonly listen = SafeProcssWrap(this, 1000);

  constructor() {
    super();
    this.on('error', this.error.bind(this));
    this.on('exit', this.exit.bind(this));
  }
  
  error(e: ProcessException, name?: string){
    process.send({
      key: 'error',
      value: name + ':' + e.message
    });
  }

  async exit() {
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

const pro = new CustomService();
pro.listen();