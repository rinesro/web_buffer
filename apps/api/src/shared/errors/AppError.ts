export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — the request body/query/params failed schema validation. */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
}

/** 401 — missing, invalid, or expired credentials. */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

/** 403 — authenticated, but not allowed to perform this action. */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message = 'Forbidden') {
    super(message);
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

/** 409 — the request conflicts with the current state (e.g. duplicate unique field). */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;
}

/** 500 — unexpected failure; isOperational=false so it gets logged at error level. */
export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message = 'Internal server error') {
    super(message);
  }
}

/** 503 — the endpoint exists but a required piece of server configuration is missing. */
export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly isOperational = true;

  constructor(message = 'Service unavailable') {
    super(message);
  }
}
