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

    const path = req.path.replace(/^\/api/, '');

    const route = tenant.allowedRoutes.find((r: any) =>
      path.startsWith(r.path),
    );

    if (!route) {
      logRouteDeny(req, tenant.id);
      gatewayRouteDenialsTotal.inc({ tenantId: tenant.id });
      throw new ForbiddenException('Route not allowed for tenant');
    }

    (req as any).upstream = tenant.upstreamBaseUrl;

    // Optional: attach route policy for later guards
    (req as any).route = route;

    return true;
  }
}
