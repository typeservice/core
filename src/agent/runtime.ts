import 'reflect-metadata';
import * as net from 'net';
import { AgentFactory } from '.';
import * as minimist from 'minimist';
import { RequireWithDefault } from '../shared/';
import NAMESPACE from './decorates/namespace';
import { MiddlewareFactory } from './middleware-factory';
import { AgentContext } from './context';

type ParametersType = { 
  Agent: {
    Script: string,
    Arguments: string,
    Token: string,
  } 
}

type AgentFactoryType = {
  new(...args: any[]): AgentFactory
}

const parameters = minimist<ParametersType>(process.argv.slice(2));
const args = JSON.parse(parameters.Agent.Arguments) as any[];
const AgentScript = RequireWithDefault<AgentFactoryType>(parameters.Agent.Script);
const agent = new AgentScript(...args);

const targetProperties = Object.getOwnPropertyNames(AgentScript.prototype);
for (let i = 0; i < targetProperties.length; i++) {
  const property = targetProperties[i];
  const target = AgentScript.prototype[property];
  if (property === 'constructor') continue;
  const isMethod = Reflect.getMetadata(NAMESPACE.METHOD, target);
  const isInitialize = Reflect.getMetadata(NAMESPACE.SETUP, target);
  const isTerminate = Reflect.getMetadata(NAMESPACE.EXIT, target);
  const isError = Reflect.getMetadata(NAMESPACE.ERROR, target);
  const middleware = Reflect.getMetadata(NAMESPACE.MIDDLEWARE, target) as MiddlewareFactory<AgentContext>;
  const functional = (<any>agent)[property];

  if (isInitialize) agent.on('setup', functional.bind(agent));
  if (isTerminate) agent.on('exit', functional.bind(agent));
  if (isError) agent.on('error', functional.bind(agent));

  if (isMethod) {
    if (!middleware) {
      agent.messager.method(property, async (data: any, socket?: net.Socket) => {
        const ctx = new AgentContext(data, socket);
        const result = await functional.call(agent, ctx);
        if (result !== undefined) return result;
      });
    } else {
      agent.messager.method(property, middleware.exec(functional.bind(agent)));
    }
  }
}

agent.listen(async (e: Error) => agent.messager.send('master', '%', {
  hash: parameters.Agent.Token,
  error: e.message,
})).then(() => agent.messager.send('master', '%', {
  hash: parameters.Agent.Token
}));