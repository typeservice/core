import * as path from 'path';
import axios from 'axios';
import Frameworker from './lib/worker/frameworker';

describe('Test the function of the worker process', () => {
  test('<MASTER> Create a frameworker', done => {
    const frameworker = new Frameworker();
    frameworker.listen()
      .then(() => axios.get('http://127.0.0.1:8080'))
      .then(res => expect(res.data).toBe('ok'))
      .then(() => frameworker.messager.invoke('master', 'abc', 123))
      .then(res => expect(res).toBe(123))
      .finally(() => {
        frameworker.stop();
        done();
      });
  });

  test('<MASTER> Create a frameworker with an agent', done => {
    const frameworker = new Frameworker();
    frameworker.listen()
      .then(() => frameworker.messager.create('abc', path.resolve(__dirname, './agent/abc'), 678, 'evio'))
      .then(() => frameworker.messager.invoke('abc', 'test', 666))
      .then(res => expect(res).toBe('evio:1444'))
      .then(() => expect(frameworker.messager.nodes).toEqual(1))
      .then(() => expect(frameworker.messager.channels).toEqual(1))
      .catch(e => frameworker.messager.destroy('abc').then(() => Promise.reject(e)).catch(() => Promise.reject(e)))
      .then(() => frameworker.messager.destroy('abc'))
      .then(() => expect(frameworker.messager.nodes).toEqual(0))
      .then(() => expect(frameworker.messager.channels).toEqual(0))
      .finally(() => frameworker.stop())
      .then(done);
  });

  test('<MASTER> Create a frameworker with muilt agents', done => {
    const frameworker = new Frameworker();
    frameworker.listen()
      .then(() => Promise.all([
        frameworker.messager.create('abc', path.resolve(__dirname, './agent/abc'), 678, 'evio'),
        frameworker.messager.create('def', path.resolve(__dirname, './agent/def'), 800, 'evio')
      ]))
      .then(() => frameworker.messager.invoke('def', 'test', 666))
      .then(res => expect(res).toBe('evio:evio:1544:800'))
      .then(() => expect(frameworker.messager.nodes).toEqual(2))
      .then(() => expect(frameworker.messager.channels).toEqual(2))
      .catch(e => Promise.all([
        frameworker.messager.destroy('abc'),
        frameworker.messager.destroy('def')
      ]).then(() => Promise.reject(e)).catch(() => Promise.reject(e)))
      .then(() => Promise.all([
        frameworker.messager.destroy('abc'),
        frameworker.messager.destroy('def')
      ]))
      .then(() => expect(frameworker.messager.nodes).toEqual(0))
      .then(() => expect(frameworker.messager.channels).toEqual(0))
      .finally(() => frameworker.stop())
      .then(done);
  })
})