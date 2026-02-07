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
    
    // console.log('route GUARD HIT');
    
    const req = context.switchToHttp().getRequest<Request>();
    const tenant = (req as any).tenant;

    if (!tenant) {
      throw new ForbiddenException('Tenant not resolved');
    }

    // Strip gateway prefix
    const path = req.path.replace(/^\/api/, '');

    // console.log('RouteGuard - path:', path, 'allowedRoutes:', tenant.allowedRoutes);
    // console.log('Route match result:', tenant.allowedRoutes.some((r: string) => path.startsWith(r)));

    if (!tenant.allowedRoutes.some((r: string) => path.startsWith(r))) {
      logRouteDeny(req,tenant.id);
      gatewayRouteDenialsTotal.inc();
      throw new ForbiddenException('Route not allowed for tenant');
    }

    return true;
  }
}
