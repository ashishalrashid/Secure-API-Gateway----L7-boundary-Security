import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpException, HttpStatus } from "@nestjs/common";
import { Observable } from "rxjs";
import type { Request } from "express";
import { redis } from "src/common/redis/redis.client";

const WINDOW_SECONDS =60;
const MAX_REQUESTS =100;

@Injectable()
export class RateLimitGuard implements CanActivate{
  async canActivate(context: ExecutionContext): Promise<boolean> {
      const req=context.switchToHttp().getRequest<Request>();

      const apiKey = req.headers['x-api-key'];
      const route=req.path;

      if (!apiKey){
        throw new UnauthorizedException('u should not be able to see this RATE LIMIT MISSING API KEy');
      }

      const redisKey=`rl:${apiKey}:${route}:${window}`;
      const count =await redis.incr(redisKey);

      if (count ===1){
        await redis.expire(redisKey,WINDOW_SECONDS);
      }

      if (count >MAX_REQUESTS){
        throw new HttpException('Rate Limited',HttpStatus.TOO_MANY_REQUESTS,);
      }
      return true;
  }
}