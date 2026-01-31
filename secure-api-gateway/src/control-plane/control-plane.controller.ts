import * as crypto from 'crypto';
import { Tenant } from 'src/common/tenant/tenant.model';
import { redis } from 'src/common/redis/redis.client';
import { AdminGuard } from './guards/admin.guard';
import { Controller, UseGuards, Post ,Body } from '@nestjs/common';

@Controller('control-plane')
@UseGuards(AdminGuard)
export class ControlPlaneController{
    private hashApiKey(apiKey:string):string{
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
    private generateApiKey(): string{
        return crypto.randomBytes(32).toString('hex');
    }

    //create tenant
    @Post('tenants')
    async createTenant(@Body() body: {
    id: string;
    name: string;
    idp: {
        issuer: string;
        jwksUri: string;
        audience: string;
    };
    allowedRoutes: string[];
    }) {
    const tenantKey = `tenant:${body.id}`;

    const exists = await redis.get(tenantKey);
    if (exists) {
        return { error: 'Tenant already exists' };
    }

    const tenant = {
        id: body.id,
        name: body.name,
        idp: body.idp,
        allowedRoutes: body.allowedRoutes,
    };

    await redis.set(tenantKey, JSON.stringify(tenant));

    return {
        status: 'tenant created',
        tenantId: tenant.id,
    };
    }
}
