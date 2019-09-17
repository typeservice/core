import * as net from 'net';
import { AgentContext } from './context';
import { ComposeMiddleware, Compose } from '../shared';
export class MiddlewareFactory<T extends AgentContext<D, R>, D = any, R = any> {
  private readonly stacks: ComposeMiddleware<T>[] = [];

  public add(...fn: ComposeMiddleware<T>[]) {
    this.stacks.unshift(...fn);
  }

  public exec(callback: (ctx: T) => Promise<any>) {
    const feedback = this.transform(callback);
    return async (data: D, socket?: net.Socket) => {
      const ctx = (new AgentContext<D, R>(data, socket)) as T;
      await feedback(ctx);
      if (ctx.body !== undefined) return ctx.body;
    }
  }

  private transform(callback: (ctx: T) => Promise<any>) {
    const stacks = this.stacks.slice(0);
    stacks.push(async (ctx, next) => {
      const result = await callback(ctx);
      await next();
      if (result !== undefined) ctx.body = result;
    });
    return Compose<T>(stacks);
  }
}