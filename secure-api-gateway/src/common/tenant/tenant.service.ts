import { Injectable } from '@nestjs/common';
import { Tenant } from './tenant.model';

@Injectable()
export class TenantService {
  private tenants: Tenant[] = [
    {
      id: 'tenant-a',
      name: 'Tenant A',

      apiKey: 'test-api-key',

      idp: {
        issuer: 'https://dev-ashishalrashid.uk.auth0.com/',
        jwksUri: 'https://dev-ashishalrashid.uk.auth0.com/.well-known/jwks.json',
        audience: 'api-gateway',
      },

      allowedRoutes: ['/health', '/orders'],
    },
  ];

  findByApiKey(apiKey:string):Tenant | undefined{
    return this.tenants.find(t=>t.apiKey===apiKey);
  }
}
