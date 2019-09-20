import * as Timer from '../timer';
import { ProcessException, EventEmitter, Logger } from '../shared';

export type SafeProcssWrapSetupCallback = (callback?: (e: Error) => Promise<any>) => Promise<any>;

export function SafeProcssWrap<T extends EventEmitter>(script: T, timeout?: number): SafeProcssWrapSetupCallback {
  timeout = timeout || Number(process.env.EXIT_TIMEOUT || 3000);
  let closing = false;
  process.on('unhandledRejection', DealWithError('unhandledRejection'));
  process.on('uncaughtException', DealWithError('uncaughtException'));
  process.on('beforeExit', onExit);

  /**
   * Bind signals.
   * It should be invoked when press `control + c` or `control + |`
   * if not been binded
   * it will not worker well.
   */
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
  process.on('SIGQUIT', onExit);

  /**
   * Invoke setup lifecycle
   * if catch error, it should emit the exit handler.
   */
  return async (callback?: (e: Error) => Promise<any>) => {
    return await Promise.resolve(script.sync('setup'))
    .catch(async e => {
      await script.sync('error', e, 'ESETUP');
      typeof callback ==='function' && await callback(e);
      onExit();
    });
  }

  function onExit() {
    if (closing) return;
    closing = true;
    const start = Date.now();
    let done = false;
  
    /**
     * Invoke exit lifecycle
     * then make `done` is true to exit this process.
     */
    Promise.resolve(script.sync('exit'))
      .catch(e => script.sync('error', e, 'EEXIT'))
      .then(() => done = true);
  
    const timer = setInterval(() => {
      if ((Date.now() - start > timeout) || done) {
        clearInterval(timer);
        if (!done) {
          // if not done , 
          // it means to timeouted.
          const err = new ProcessException('Process on exit timeout:' + timeout, 'EEXIT_TIMEOUT');
          script.sync('error', err, err.code);
        }
        Timer.destroy();
        process.exit(0);
      }
    }, 10);
  }

  function DealWithError(name: string) {
    return (error: ProcessException) => script.sync('error', error, name);
  }
}