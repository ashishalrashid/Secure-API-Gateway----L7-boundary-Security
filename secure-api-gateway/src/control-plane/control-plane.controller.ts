import * as crypto from 'crypto';
import { Tenant } from 'src/common/tenant/tenant.model';
import { redis } from 'src/common/redis/redis.client';
import { AdminGuard } from './guards/admin.guard';
import { Controller, UseGuards, Post ,Body, Param, } from '@nestjs/common';

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

    //rotate and create api keys
    @Post('tenants/:id/apikey')
    async rotateApiKey(@Param('id') tenantId:string){

        const tenantKey= `tenant:${tenantId}`;
        const tenantJson =await redis.get(tenantKey);
        
        if (!tenantJson){
            return {error:'tenant not found'};
        }

        const apikey =this.generateApiKey();
        const hash =this.hashApiKey(apikey);

        await redis.set(`tenant:byApiKey:${hash}`,tenantId);

        return {
            apikey,warning:'Store key , cannot be retrived again'
        };
    }
}
