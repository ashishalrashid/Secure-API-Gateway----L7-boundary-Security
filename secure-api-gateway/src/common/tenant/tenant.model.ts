export interface Tenant {
  id: string;
  name: string;
  upstreamBaseUrl: string;

  /**
   * Optional Identity Provider config.
   */
  idp?: {
    issuer: string;
    jwksUri: string;
    audience: string;
  };

  allowedRoutes: {
    path: string;
    auth?: {
      jwt?: boolean; // default: true if tenant.idp exists
    };
  }[];
  rateLimit: {
    windowSeconds: number;
    maxRequests: number;
  };
}
