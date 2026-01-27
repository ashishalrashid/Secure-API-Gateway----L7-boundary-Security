import { Controller, Get } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('health')
  health() {
    return { status: 'ok', plane: 'control' };
  }

  @Get('routes')
  routes() {
    return {
      message: 'Routing config will live here (stub)',
    };
  }
}
