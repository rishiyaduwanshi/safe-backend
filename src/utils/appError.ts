import { HttpStatus, ValidationError } from '@/types/common.types';

interface AppErrorOptions {
  readonly statusCode?: HttpStatus;
  readonly message?: string;
  readonly errors?: ValidationError[];
  readonly stack?: string;
}

export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly success: false = false;
  public readonly errors: ValidationError[];

  constructor({ 
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR, 
    message = 'Internal Server Error', 
    errors = [], 
    stack = '' 
  }: AppErrorOptions) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super({ message, statusCode: HttpStatus.NOT_FOUND });
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', errors?: ValidationError[]) {
    super({ message, statusCode: HttpStatus.BAD_REQUEST, errors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super({ message, statusCode: HttpStatus.UNAUTHORIZED });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super({ message, statusCode: HttpStatus.FORBIDDEN });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super({ message, statusCode: HttpStatus.CONFLICT });
  }
}
