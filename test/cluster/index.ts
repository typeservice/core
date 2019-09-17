import * as path from 'path';
import { ClusterFactory } from '../../src';

const cluster = new ClusterFactory();
cluster.messager.method('abc', async (data: any) => data.a + data.b);
cluster.install('../singleton/index.ts', {
  cwd: __dirname
});

cluster.listen()
.then(() => cluster.messager.create('abc', path.resolve(__dirname, '../agent/abc.ts'), 678))
.then(() => console.log('cluster create agent abc'));