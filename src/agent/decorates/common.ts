import 'reflect-metadata';
import NAMESPACE from './namespace';
import { ComposeMiddleware } from '../../shared';
import { AgentContext } from '../context';
import { MiddlewareFactory } from '../middleware-factory';

export const method: MethodDecorator = (target, property, descriptor) => {
  Reflect.defineMetadata(NAMESPACE.METHOD, true, descriptor.value);
}

export const initialize: MethodDecorator = (target, property, descriptor) => {
  Reflect.defineMetadata(NAMESPACE.SETUP, true, descriptor.value);
}

export const terminate: MethodDecorator = (target, property, descriptor) => {
  Reflect.defineMetadata(NAMESPACE.EXIT, true, descriptor.value);
}

export const error: MethodDecorator = (target, property, descriptor) => {
  Reflect.defineMetadata(NAMESPACE.ERROR, true, descriptor.value);
}

export function middleware<T extends AgentContext>(...args: ComposeMiddleware<T>[]) {
  return (target: Object, property: string | symbol, descriptor: TypedPropertyDescriptor<(args: T) => Promise<any>>) => {
    let middlewareFactory = Reflect.getMetadata(NAMESPACE.MIDDLEWARE, descriptor.value) as MiddlewareFactory<T>;
    if (!middlewareFactory) {
      middlewareFactory = new MiddlewareFactory<T>();
      Reflect.defineMetadata(NAMESPACE.MIDDLEWARE, middlewareFactory, descriptor.value);
    }
    middlewareFactory.add(...args);
  }
}