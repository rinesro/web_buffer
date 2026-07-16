import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    respond(res, new ValidationError('Request validation failed', err.flatten().fieldErrors));
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path, method: req.method }, 'Non-operational error');
    }
    respond(res, err);
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  const body: ErrorResponseBody = {
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  };
  res.status(500).json(body);
}

function respond(res: Response, error: AppError): void {
  const body: ErrorResponseBody = {
    success: false,
    error: {
      code: error.constructor.name.replace(/Error$/, '').toUpperCase() || 'ERROR',
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
  res.status(error.statusCode).json(body);
}
