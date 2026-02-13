import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      tls:
        process.env.REDIS_TLS === 'true'
          ? {
              rejectUnauthorized:
                process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
            }
          : undefined,
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
