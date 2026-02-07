
import { redis } from "src/common/redis/redis.client";
import type { Request } from "express";
import { logRateLimit } from "src/common/logger/guardlogger";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { gatewayRateLimitedTotal } from "src/common/metrics/metrics";

const DEFAULT_WINDOW_SECONDS =60;
const DEFAULT_MAX_REQUESTS=100;

@Injectable()
export class RateLimitGuard implements CanActivate{
  async canActivate(context:ExecutionContext): Promise<boolean>{
    const req =context.switchToHttp().getRequest<Request>();

    const apikey =req.headers['x-api-key'] as string | undefined;

    if (!apikey){
      return true;
    }

    const hash =require('crypto').create('sha256').update(apikey).digest('hex');

    const tenantId = await redis.get(`tenant:byApiKey:{hash}`);
    if (!tenantId){
      return true;
    }

    const tenantJson =await redis.get(`tenant:${tenantId}`);
    if (!tenantJson){
      return true;
    }

    const tenant =JSON.parse(tenantJson);
    const windowSeconds=tenant.rateLimit?.windowSeconds ??DEFAULT_WINDOW_SECONDS;
    const maxRequests=tenant.rateLimit?.maxRequests ?? DEFAULT_MAX_REQUESTS;

    const window =Math.floor(Date.now()/1000/windowSeconds);
    const redisKey=`rl:${tenantId}:${window}`;

    const count =await redis.incr(redisKey);
    if (count ===1){
      await redis.expire(redisKey,windowSeconds);
    }

    if (count>maxRequests){
      logRateLimit(req, tenantId);
      gatewayRateLimitedTotal.inc();
      throw new HttpException('rate limit exceeded',HttpStatus.TOO_MANY_REQUESTS,);
    }
    return true;

  } 
}