import { AgentFactory, ipc, AgentContext } from '../../src';

export default class ABCAgent extends AgentFactory {
  private readonly _max: number;
  constructor(max: number) {
    super();
    this._max = max;
  }

  @ipc.method
  @ipc.middleware<AgentContext>(async (ctx, next) => {
    console.log('ctx', ctx);
    await next();
  })
  async test(ctx: AgentContext) {
    return ctx.data + this._max;
  }

  @ipc.initialize
  setup() {
    console.log('agent init')
  }

  @ipc.terminate
  exit() {
    console.log('agent exit')
  }
}