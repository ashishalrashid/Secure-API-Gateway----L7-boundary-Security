import * as crypto from 'crypto';
import { Tenant } from 'src/common/tenant/tenant.model';
import { redis } from 'src/common/redis/redis.client';
import { AdminGuard } from './guards/admin.guard';
import { Controller, UseGuards, Post ,Body, Param, Put, HttpException, HttpStatus, Get, HttpCode} from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { json } from 'stream/consumers';
import { logger } from 'src/common/logger/logger';
import { controlMutationsTotal } from 'src/common/metrics/metrics';

@Controller('control-plane')
@UseGuards(AdminGuard)
export class ControlPlaneController{
    private hashApiKey(apiKey:string):string{
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
    private generateApiKey(): string{
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Normalize routes to object format
     */
    private normalizeRoutes(routes: (string | { path: string; auth?: { jwt?: boolean } })[]) {
        return routes.map(route => 
            typeof route === 'string' 
                ? { path: route }
                : route
        );
    }

    //create tenant
    @Post('tenants')
    @HttpCode(201)
    async createTenant(@Body() body: any) {
    const tenantKey = `tenant:${body.id}`;

    const exists = await redis.get(tenantKey);
    if (exists) {
        throw new HttpException('Tenant already exists', HttpStatus.CONFLICT);
    }

    const tenant: Tenant = {
        id: body.id,
        name: body.name,
        upstreamBaseUrl: body.upstreamBaseUrl || 'http://localhost:3000',
        idp: body.idp,
        allowedRoutes: this.normalizeRoutes(body.allowedRoutes || []),
        rateLimit: body.rateLimit || { windowSeconds: 60, maxRequests: 100 },
    };

    await redis.set(tenantKey, JSON.stringify(tenant));
    await redis.multi()
        .set(`tenant:${body.id}`, JSON.stringify(tenant))
        .sadd('tenant:index', tenant.id)
        .exec();

    logger.info({
        plane:'control',
        action:'create_tenant',
        tenantId:body.id,
    });

    return {
        status: 'tenant created',
        tenantId: tenant.id,
    };
    }

    //rotate and create api keys
    @Post('tenants/:id/apikey')
    @HttpCode(201)
    async rotateApiKey(@Param('id') tenantId:string){

        const tenantKey= `tenant:${tenantId}`;
        const tenantJson =await redis.get(tenantKey);
        
        if (!tenantJson){
            throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
        }

        const apiKey =this.generateApiKey();
        const hash =this.hashApiKey(apiKey);

        await redis.set(`tenant:byApiKey:${hash}`,tenantId);

        logger.info({
        plane:'control',
        action:'rotate_key',
        tenantId:tenantId,
        });

        controlMutationsTotal.inc({ action: 'rotate_apiKey' });

        return {
            apiKey,warning:'Store key , cannot be retrived again'
        };
    }
    //update idp
    @Put('tenants/:id/idp')
    async updateTenantIdp(
        @Param('id') tenantId:string,
        @Body()
        body:{
            issuer:string;
            jwksUri:string;
            audience:string;
        },
    ){
        const tenantKey =`tenant:${tenantId}`;
        const tenantJson =await redis.get(tenantKey);

        if (!tenantJson){
            throw new HttpException('tenant not resolved',HttpStatus.NOT_FOUND);
        }

        if (!body.issuer||!body.audience || !body.jwksUri){
            throw new HttpException('issuer , jwksuri and audience required', HttpStatus.BAD_REQUEST);
        }

        const tenant =JSON.parse(tenantJson);
        tenant.idp  =body;

        await redis.set(tenantKey,JSON.stringify(tenant));

        logger.info({
        plane:'control',
        action:'update_idp',
        tenantId:tenantId,
        });

        controlMutationsTotal.inc({ action: 'update_idp' });

        return {tenantId,idp:tenant.idp};
    }

    //Update routes
    @Put('tenants/:id/routes')
    async updateTenantRoutes(
        @Param('id') tenantId:string,
        @Body()
        body:{allowedRoutes: (string | { path: string; auth?: { jwt?: boolean } })[];},
    ){
        const tenantKey=`tenant:${tenantId}`;
        const tenantJson=await redis.get(tenantKey);

        if (!tenantJson){
            throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
        }

        if(!Array.isArray(body.allowedRoutes)){
            throw new HttpException('Allowed routes must be an array',HttpStatus.BAD_REQUEST);
        }

        const tenant =JSON.parse(tenantJson);
        tenant.allowedRoutes = this.normalizeRoutes(body.allowedRoutes);

        await redis.set(tenantKey,JSON.stringify(tenant));

        logger.info({
        plane:'control',
        action:'update_routes',
        allowedRoutes:tenant.allowedRoutes,
        });
        controlMutationsTotal.inc({ action: 'update_routes' });

        return {tenantId,allowedRoutes:tenant.allowedRoutes};
    }

    //List all tenants {observability}
    @Get('tenants')
    async listTenants() {
        const tenantIds = await redis.smembers('tenant:index');

        const tenants: any[]= [];

        for (const tenantId of tenantIds) {
            const tenantJson = await redis.get(`tenant:${tenantId}`);
            if (!tenantJson) continue;

            tenants.push(JSON.parse(tenantJson));
        }
        return tenants;
    }
}
