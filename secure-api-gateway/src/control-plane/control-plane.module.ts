import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller';

@Module({
  controllers: [AdminController]
})
export class ControlPlaneModule {}
