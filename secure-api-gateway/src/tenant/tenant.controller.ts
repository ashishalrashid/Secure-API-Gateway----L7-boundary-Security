import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { register } from 'src/common/metrics/metrics';

@Controller('tenant')
@UseGuards(ApiKeyGuard)
export class TenantController {

  /**
   * Read-only tenant info
   */
  @Get('me')
  getMe(@Req() req: Request) {
    const tenant = (req as any).tenant;

    return {
      id: tenant.id,
      name: tenant.name,
      allowedRoutes: tenant.allowedRoutes,
      idp: tenant.idp,
    };
  }

  /**
   * Tenant-scoped metrics (SAFE JSON VIEW)
   */
  @Get('metrics')
async getTenantMetrics(@Req() req: Request) {
  const tenantId = (req as any).tenant.id;

  const metrics = await register.getMetricsAsJSON();

  const sumForTenant = (metricName: string) => {
    const metric = metrics.find(m => m.name === metricName);
    if (!metric) return 0;

    return metric.values
      .filter(v => v.labels?.tenantId === tenantId)
      .reduce((acc, v) => acc + v.value, 0);
  };

  return {
    tenantId,
    requests: {
      total: sumForTenant('gateway_requests_total'),
      rateLimited: sumForTenant('gateway_rate_limited_total'),
      authFailures: sumForTenant('gateway_auth_failures_total'),
      routeDenials: sumForTenant('gateway_route_denials_total'),
      upstreamErrors: sumForTenant('gateway_upstream_errors_total'),
      internalErrors: sumForTenant('gateway_internal_errors_total'),
    },
  };
}

}
