import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as httpProxy from 'http-proxy';

import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { RateLimitGuard } from 'src/common/guards/rate-limit/rate-limit.guard';
import { RouteGuard } from 'src/common/guards/route/route.guard';

import {
  gatewayUpstreamErrorsTotal,
} from 'src/common/metrics/metrics';

const proxy = httpProxy.createProxyServer({});

@Controller()
@UseGuards(ApiKeyGuard, RouteGuard, JwtGuard, RateLimitGuard)
export class GatewayController {

  constructor() {
    /**
     * Transport-level upstream errors
     */
    proxy.on('error', (err, req: any, res: any) => {
      const tenantId = req?.tenant?.id ?? 'unknown';

      gatewayUpstreamErrorsTotal.inc({ tenantId });

      console.error('PROXY TRANSPORT ERROR:', err.message);

      if (!res.headersSent) {
        res.statusCode = 502;
        res.end('Bad Gateway');
      }
    });

    /**
     *Application-level upstream errors (5xx)
     */
    proxy.on('proxyRes', (proxyRes, req: any) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
        const tenantId = req?.tenant?.id ?? 'unknown';

        gatewayUpstreamErrorsTotal.inc({ tenantId });
      }
    });
  }

  @All('api/*')
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    const originalUrl = req.url;

    // Strip gateway prefix
    req.url = req.url.replace(/^\/api/, '');

    const upstream = (req as any).upstream;

    if (!upstream) {
      res.status(500).json({
        error: 'Upstream not resolved',
      });
      return;
    }

    console.log(
      'GATEWAY → UPSTREAM:',
      originalUrl,
      '→',
      upstream + req.url,
    );

    proxy.web(req, res, {
      target: upstream,
      changeOrigin: true,
    });
  }
}
