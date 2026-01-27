import { Module } from '@nestjs/common';
import { DataPlaneModule } from './data-plane/data-plane.module';
import { ControlPlaneModule } from './control-plane/control-plane.module';
import { ControlPlaneController } from './control-plane/control-plane.controller';


@Module({
  imports: [
    DataPlaneModule,
    ControlPlaneModule,
  ],
  controllers: [ControlPlaneController],
})
export class AppModule {}
