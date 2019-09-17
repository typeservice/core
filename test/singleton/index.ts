import * as path from 'path';
import Frameworker from './frameworker';
import { IPCException, resolve } from '../../src';

const frameworker = new Frameworker();

frameworker.listen()
.then(() => frameworker.messager.invoke('master', 'abc', { a: 1, b: 2 }))
.then(data => console.log('result:', data))
.catch((e: IPCException) => console.error(e.message))
.then(() => frameworker.messager.create('abc', path.resolve(__dirname, '../agent/abc'), 678))
.then(() => new Promise(resolve => setTimeout(resolve, 5000)))
.then(() => console.log('start invoke abc.test'))
.then(() => frameworker.messager.invoke('abc', 'test', 666, 3000))
.then((data) => console.log('end invoke abc.test', data))
.catch(e => console.error(e))
