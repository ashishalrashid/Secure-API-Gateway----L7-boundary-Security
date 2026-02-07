import request from 'supertest';
import { createTestApp } from './test-app';

describe('Control Plane', () => {
  let app;

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = 'super-secret-admin-token';
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates tenant', async () => {
    await request(app.getHttpServer())
      .post('/control-plane/tenants')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .send({
        id: 'tenant-test',
        name: 'Tenant Test',
        idp: {
          issuer: 'x',
          jwksUri: 'y',
          audience: 'z',
        },
        allowedRoutes: ['/health'],
      })
      .expect(201);
  });

  it('rotates api key', async () => {
    const res = await request(app.getHttpServer())
      .post('/control-plane/tenants/tenant-test/apikey')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .expect(201);

    expect(res.body.apiKey).toBeDefined();
  });

  it('lists tenants', async () => {
    const res = await request(app.getHttpServer())
      .get('/control-plane/tenants')
      .set('X-Admin-Token', 'super-secret-admin-token')
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
  });
});
