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

const proxy = httpProxy.createProxyServer({});

@Controller('api')
@UseGuards(ApiKeyGuard, JwtGuard,RateLimitGuard)
export class GatewayController {
  private readonly upstream = 'http://localhost:4000';

  @All('*path')
  proxyRequest(@Req() req: Request, @Res() res: Response) {

    req.url =req.url.replace(/^\/api/,'');

    proxy.web(req, res, { target: this.upstream }, (err) => {
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    });
  }
}
