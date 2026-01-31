import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Get
} from '@nestjs/common';
import type { Request, Response  } from 'express';
import * as httpProxy from 'http-proxy';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { RateLimitGuard } from 'src/common/guards/rate-limit/rate-limit.guard';
import { RouteGuard } from 'src/common/guards/route/route.guard';

const proxy = httpProxy.createProxyServer({});

@Controller()
// @UseGuards(ApiKeyGuard, JwtGuard, RouteGuard, RateLimitGuard)
@UseGuards(ApiKeyGuard,JwtGuard,RouteGuard,RateLimitGuard)
export class GatewayController {
  private readonly upstream = 'http://localhost:4000';

  constructor() {
    proxy.on('error', (err, req, res: any) => {
      console.error('PROXY ERROR:', err.message);

      if (!res.headersSent) {
        res.statusCode = 502;
        res.end('Bad Gateway');
      }
    });
  }

  @All('api/*')
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    console.log('GATEWAY CONTROLLER HIT - Request to:', req.url);
    const originalUrl = req.url;
    req.url = req.url.replace(/^\/api/, '');

    console.log('PROXY:', originalUrl, '→', req.url);

    proxy.web(req, res, {
      target: this.upstream,
      changeOrigin: true,
    });
  }
    // @Controller()
    // @Get('api/ping')
    // ping() {
    //   return { ok: true };
    // }
  }
