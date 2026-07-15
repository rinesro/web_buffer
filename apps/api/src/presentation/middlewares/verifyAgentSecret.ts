import type { NextFunction, Request, Response } from 'express';
import { config } from '../../shared/config';
import { ServiceUnavailableError, UnauthorizedError } from '../../shared/errors/AppError';

const AGENT_SECRET_HEADER = 'x-agent-secret';

export function verifyAgentSecret(req: Request, _res: Response, next: NextFunction): void {
  if (!config.nacAgentSecret) {
    next(new ServiceUnavailableError('NAC sighting ingest is not configured on this server'));
    return;
  }

  const presented = req.headers[AGENT_SECRET_HEADER];
  if (typeof presented !== 'string' || presented !== config.nacAgentSecret) {
    next(new UnauthorizedError('Invalid or missing agent secret'));
    return;
  }

  next();
}
