import { Module } from '@nestjs/common';
import { GatewayController } from './gateway/gateway.controller';

@Module({
  controllers: [GatewayController]
})
export class DataPlaneModule {}
