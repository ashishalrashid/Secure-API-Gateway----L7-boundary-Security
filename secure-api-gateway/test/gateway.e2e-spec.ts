import request from 'supertest';
import { createTestApp } from './test-app';

describe('Gateway', () => {
  let app;
  let apiKey: string;

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = 'super-secret-admin-token';
    app = await createTestApp();

    // create tenant
    await request(app.getHttpServer())
      .post('/control-plane/tenants')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .send({
        id: 'gw-tenant',
        name: 'GW Tenant',
        idp: { issuer: 'x', jwksUri: 'y', audience: 'z' },
        allowedRoutes: ['/health'],
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
});
