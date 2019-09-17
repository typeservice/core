class HttpException extends Error {
  public readonly name: string = 'HttpException';
  public readonly code: number;
  constructor(msg: string, code?: number) {
    super();
    this.message = msg;
    this.code = code || 500;
  }
}


class ProcessException extends Error {
  public readonly name: string = 'ProcessException';
  public readonly code: string;
  constructor(msg: string, code?: string) {
    super();
    this.message = msg;
    this.code = code;
  }
}

class IPCException extends HttpException {
  public readonly name: string = 'IPCException';
}

export {
  HttpException,
  ProcessException,
  IPCException,
}