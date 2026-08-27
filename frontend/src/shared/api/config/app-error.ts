export class AppError extends Error {
  constructor(public readonly options: AppErrorOptions) {
    super(options.message)
    this.name = 'AppError'
  }

  get code() {
    return this.options.code
  }
  get statusCode() {
    return this.options.statusCode
  }
  get message() {
    return this.options.message
  }
}

interface AppErrorOptions {
  readonly code: string
  readonly message: string
  readonly statusCode: number
}
