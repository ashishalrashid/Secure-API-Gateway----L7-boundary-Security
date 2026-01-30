import { Injectable } from '@nestjs/common';
import { Tenant } from './tenant.model';
import { redis } from '../redis/redis.client';
import * as crypto from 'crypto';

@Injectable()
export class TenantService{
    private hashApiKey(apiKey: string):string{
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }


    async findByApiKey(apiKey:string) :Promise<Tenant|null>{
        const apiKeyHash= this.hashApiKey(apiKey);

        const tenantId=await redis.get(`tenant:byApiKey:${apiKeyHash}`);
        if (!tenantId) return null;

        const tenantJson =await redis.get(`tenant:${tenantId}`);
        if (!tenantJson) return null;

        return JSON.parse(tenantJson) as Tenant;
    }
}
