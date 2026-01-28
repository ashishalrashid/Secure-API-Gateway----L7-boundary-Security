import { Module } from '@nestjs/common';
import { DataPlaneModule } from './data-plane/data-plane.module';
import { ControlPlaneModule } from './control-plane/control-plane.module';
import { ControlPlaneController } from './control-plane/control-plane.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DataPlaneModule,
    ControlPlaneModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [ControlPlaneController],
})
export class AppModule {}
