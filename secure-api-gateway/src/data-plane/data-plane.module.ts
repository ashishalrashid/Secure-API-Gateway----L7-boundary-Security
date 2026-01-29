import { Module } from '@nestjs/common';
import { GatewayController } from './gateway/gateway.controller';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { JwtGuard } from 'src/common/guards/jwt/jwt.guard';
import { RouteGuard } from 'src/common/guards/route/route.guard';
import { RateLimitGuard } from 'src/common/guards/rate-limit/rate-limit.guard';
import { TenantModule } from 'src/common/tenant/tenant.module';

@Module({
  imports: [
    TenantModule, 
  ],
  controllers: [GatewayController],
  providers: [
    ApiKeyGuard,
    JwtGuard,
    RouteGuard,
    RateLimitGuard,
  ],
})
export class DataPlaneModule {}
