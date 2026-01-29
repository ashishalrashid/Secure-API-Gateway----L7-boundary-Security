import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

@Injectable()
export class JwtGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  private logger = new Logger('JwtGuard');

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
      // this.logger.debug('Verifying JWT token');
      // this.logger.debug(`IDP_ISSUER: ${process.env.IDP_ISSUER}`);
      // this.logger.debug(`IDP_AUDIENCE: ${process.env.IDP_AUDIENCE}`);
      
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: process.env.IDP_ISSUER,
        audience: process.env.IDP_AUDIENCE,
      });

      this.logger.debug('JWT verified successfully');
      (req as any).identity = payload;
      return true;
    } catch (err) {
      this.logger.error('JWT verification failed', err);
      throw new UnauthorizedException(`Invalid or expired JWT: ${err.message}`);
    }
  }
}