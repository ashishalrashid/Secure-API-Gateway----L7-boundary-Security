import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as httpProxy from 'http-proxy';
import { userInfo } from 'node:os';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';

const proxy = httpProxy.createProxyServer({});

@Controller('api')
@UseGuards(ApiKeyGuard)
export class GatewayController {
  private readonly upstream = 'http://localhost:4000';

  @All('*')
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    proxy.web(req, res, { target: this.upstream }, (err) => {
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    });
  }
}
