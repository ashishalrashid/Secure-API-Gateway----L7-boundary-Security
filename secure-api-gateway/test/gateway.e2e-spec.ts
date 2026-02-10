import request from 'supertest';
import { createTestApp } from './test-app';
import { redis } from '../src/common/redis/redis.client';

describe('Gateway', () => {
  let app;
  let apiKey: string;

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = 'super-secret-admin-token';
    await redis.flushall();
    app = await createTestApp();

    // create tenant
    await request(app.getHttpServer())
      .post('/control-plane/tenants')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .send({
        id: 'gw-tenant',
        name: 'GW Tenant',

        upstreamBaseUrl: 'http://localhost:4000',

        idp: {
          issuer: 'x',
          jwksUri: 'https://example.com/.well-known/jwks.json',
          audience: 'z',
        },

        allowedRoutes: [
          {
            path: '/health',
            auth: { jwt: false }, // public route
          },
        ],

        rateLimit: {
          windowSeconds: 60,
          maxRequests: 100,
        },
      });

    // rotate key
    const res = await request(app.getHttpServer())
      .post('/control-plane/tenants/gw-tenant/apikey')
      .set('X-Admin-Token', 'super-secret-admin-token');

    apiKey = res.body.apiKey;
  });

  afterAll(async () => {
    await app.close();
  });


  it('rejects missing api key', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(401);
  });

 
  it('blocks forbidden route', async () => {
    await request(app.getHttpServer())
      .get('/api/orders')
      .set('X-API-Key', apiKey)
      .expect(403);
  });


  it('allows public route without JWT', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .set('X-API-Key', apiKey)
      .expect((res) => {
        // upstream may be down in tests — allow 502
        expect([200, 502]).toContain(res.status);
      });
  });


  it('rejects missing JWT on protected route', async () => {
    // create protected route
    await request(app.getHttpServer())
      .post('/control-plane/tenants')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .send({
        id: 'jwt-tenant',
        name: 'JWT Tenant',
        upstreamBaseUrl: 'http://localhost:4000',
        idp: {
          issuer: 'x',
          jwksUri: 'https://example.com/.well-known/jwks.json',
          audience: 'z',
        },
        allowedRoutes: [
          { path: '/secure' }, // jwt enabled by default
        ],
        rateLimit: {
          windowSeconds: 60,
          maxRequests: 100,
        },
      });

    const keyRes = await request(app.getHttpServer())
      .post('/control-plane/tenants/jwt-tenant/apikey')
      .set('X-Admin-Token', 'super-secret-admin-token');

    await request(app.getHttpServer())
      .get('/api/secure')
      .set('X-API-Key', keyRes.body.apiKey)
      .expect(401);
  });
});
