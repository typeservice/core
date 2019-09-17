# Protect the runtime process

创建一个安全的进程模型，提供三个生命周期：

- **setup** `setup(): Promise<any>;` 初始安装函数
- **exit** `exit(): Promise<any>;` 进程退出函数
- **error** `error(error: ProcessException, name?: string): Promise<any>;` 错误捕获函数

我们通过启动一个文件，提供固定参数就可以安全启动一个基于文件的进程。

```bash
ts-node src/process/index --script=test/index --env=dev --timeout.exit=9999999
```

参数详解：

- **script** `string` 执行文件地址或者模块包名 必选
- **env** `string` 环境变量 可选
- **timeout.exit** `number` 进程退出超时时间。可选。很多时候，由于任务量比较大，进程退出时间过长，你可以设定这个退出的值，保证任务能够完成。默认15分钟（15 * 60 * 1000）。

## Example

```ts
import { ProcessScriptImplements, CommandLineOptions, ProcessException } from '../src';
export default class CustomService<T extends CommandLineOptions> implements ProcessScriptImplements {
  public readonly options: T;
  private readonly _timer: NodeJS.Timer = setInterval(() => {}, 1000);
  constructor(options: T) {
    this.options = options;
  }
  
  async error(e: ProcessException, name?: string){
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
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
