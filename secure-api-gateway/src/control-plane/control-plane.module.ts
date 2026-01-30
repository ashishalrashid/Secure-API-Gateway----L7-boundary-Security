import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller';
import { ControlPlaneController } from './control-plane.controller';
import { TenantService } from 'src/common/tenant/tenant.service';
import { AdminGuard } from './guards/admin.guard';


@Module({
  controllers: [AdminController,ControlPlaneController],
  providers:[AdminGuard,TenantService],
})
export class ControlPlaneModule {}
