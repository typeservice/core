import { AgentFactory, ipc, AgentContext } from '../../src';

export default class ABCAgent extends AgentFactory {
  private readonly a: number;
  private readonly b: string;
  constructor(a: number, b: string) {
    super();
    this.a = a;
    this.b = b;
  }

  @ipc.method
  @ipc.middleware<AgentContext>(async (ctx, next) => {
    (ctx.data as number) += 100;
    await next();
  })
  async test(ctx: AgentContext) {
    return this.b + ':' + (this.a + ctx.data);
  }
}