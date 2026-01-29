import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class RouteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const tenant = (req as any).tenant;

    if (!tenant) {
      throw new ForbiddenException('Tenant not resolved');
    }

    // Strip gateway prefix
    const path = req.path.replace(/^\/api/, '');

    if (!tenant.allowedRoutes.some((r: string) => path.startsWith(r))) {
      throw new ForbiddenException('Route not allowed for tenant');
    }

    return true;
  }
}
