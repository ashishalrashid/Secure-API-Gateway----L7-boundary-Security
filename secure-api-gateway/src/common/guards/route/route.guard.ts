import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { logRouteDeny } from 'src/common/logger/guardlogger';
import { gatewayRouteDenialsTotal } from 'src/common/metrics/metrics';

@Injectable()
export class RouteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const tenant = (req as any).tenant;

    if (!tenant) {
      throw new ForbiddenException('Tenant not resolved');
    }

    if (!tenant.upstreamBaseUrl) {
      throw new ForbiddenException('Upstream base URL not configured');
    }

    /**
     * Normalize path safely
     * - Use req.path (NO query string)
     * - Strip /api prefix
     * - Remove trailing slash
     */
    let path = req.path.replace(/^\/api/, '');

    // Remove trailing slash (except if root)
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    /**
     * Strict route resolution
     * Ensures "/v1/health" matches exactly or as prefix
     */
    const route = tenant.allowedRoutes.find((r: any) => {
      const allowed = r.path.endsWith('/')
        ? r.path.slice(0, -1)
        : r.path;

      return (
        path === allowed ||          // exact match
        path.startsWith(allowed + '/') // nested route match
      );
    });

    if (!route) {
      logRouteDeny(req, tenant.id);
      gatewayRouteDenialsTotal.inc({ tenantId: tenant.id });
      throw new ForbiddenException('Route not allowed for tenant');
    }

    /**
     * Attach upstream for proxy layer
     */
    (req as any).upstream = tenant.upstreamBaseUrl;

    /**
     * Attach resolved route metadata
     */
    (req as any).route = route;

    return true;
  }
}
