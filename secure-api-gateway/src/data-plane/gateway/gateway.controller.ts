import {
  Controller,
  All,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({});

@Controller('api')
export class GatewayController {
  private readonly upstream = 'http://localhost:4000';

  @All('*')
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    proxy.web(req, res, { target: this.upstream }, (err) => {
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    });
  }
}
