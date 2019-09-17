import { ProcessException, SafeProcssWrap, EventEmitter } from '../src';
class CustomService extends EventEmitter {
  private readonly _timer: NodeJS.Timer = setInterval(() => {
    console.log('interval...')
  }, 1000);
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
    console.log('exiting...')
    clearInterval(this._timer);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async setup() {
    console.info('setup');
  }
}

const pro = new CustomService();
pro.listen();