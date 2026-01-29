import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { redis } from 'src/common/redis/redis.client';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const apiKey = req.headers['x-api-key'] as string | undefined;
    const route = req.path;

    // ApiKeyGuard should already handle this, so fail-open here
    if (!apiKey) {
      return true;
    }

    const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const redisKey = `rl:${apiKey}:${route}:${window}`;

    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, WINDOW_SECONDS);
    }

    if (count > MAX_REQUESTS) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
