import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

@Injectable()
export class JwtGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  private getJwks() {
    if (!this.jwks) {
      const uri = process.env.IDP_JWKS_URI;

      if (!uri) {
        throw new Error('IDP_JWKS_URI is not set');
      }

      this.jwks = createRemoteJWKSet(new URL(uri));
    }

    return this.jwks;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = auth.slice(7);

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: process.env.IDP_ISSUER,
        audience: process.env.IDP_AUDIENCE,
      });

      (req as any).identity = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
