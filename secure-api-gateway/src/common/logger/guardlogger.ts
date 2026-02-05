import { logger } from './logger';
import { Request } from 'express';

export function logAuthDeny(
  req: Request,
  reason: string,
  detail?: string,
) {
  logger.warn({
    plane: 'data',
    category: 'auth',
    decision: 'deny',
    reason,
    detail,
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  });
}

export function logRouteDeny(
  req: Request,
  tenantId: string,
) {
  logger.warn({
    plane: 'data',
    category: 'policy',
    decision: 'route_denied',
    tenantId,
    method: req.method,
    path: req.originalUrl,
  });
}

export function logAdminDeny(req: Request) {
  logger.warn({
    plane: 'control',
    category: 'admin_auth',
    decision: 'deny',
    ip: req.ip,
  });
}

/* NEW */

export function logJwtDeny(
  req: Request,
  tenantId: string | undefined,
  reason: string,
) {
  logger.warn({
    plane: 'data',
    category: 'jwt',
    decision: 'deny',
    tenantId,
    reason,
    method: req.method,
    path: req.originalUrl,
  });
}

export function logRateLimit(
  req: Request,
  tenantId: string | undefined,
) {
  logger.warn({
    plane: 'data',
    category: 'rate_limit',
    decision: 'throttle',
    tenantId,
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  });
}
