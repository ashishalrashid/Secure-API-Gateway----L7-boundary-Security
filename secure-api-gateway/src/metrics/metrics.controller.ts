import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { register } from 'src/common/metrics/metrics';
import { AdminGuard } from 'src/control-plane/guards/admin.guard';

@Controller()
export class MetricsController {
  @Get('/metrics')
  @UseGuards(AdminGuard)
  async metrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}