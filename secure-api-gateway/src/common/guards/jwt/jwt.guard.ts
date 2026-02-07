

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Observable } from "rxjs";
import { logJwtDeny } from "src/common/logger/guardlogger";
import type { Request } from "express";
import { gatewayAuthFailuresTotal } from "src/common/metrics/metrics";


@Injectable()
export class JwtGuard implements CanActivate{

  private jwksCache =new Map<string, ReturnType<typeof createRemoteJWKSet>>();

  private getJwks(tenantId: string, jwksUri: string){
    if (!this.jwksCache.has(tenantId)){
      this.jwksCache.set(
        tenantId,
        createRemoteJWKSet(new URL(jwksUri)),
      );

    }
    return this.jwksCache.get(tenantId)!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('JWT GUARD HIT');  
    
    const req =context.switchToHttp().getRequest<Request>();
      const tenant =(req as any).tenant;
      

      if (!tenant){
        throw new UnauthorizedException('Tenant not resolved');
      }

      const auth = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')){
        throw new UnauthorizedException('Missing Auth header');
      }

      const token =auth.slice(7);

      try {
        const { payload } =await jwtVerify(token,this.getJwks(tenant.id,tenant.idp.jwksUri),{issuer:tenant.idp.issuer,audience:tenant.idp.audience,},);

        (req as any).identity =payload;
        return true;

      } catch(error: any){
        logJwtDeny(req,tenant.id,'Invalid_jwt');
        gatewayAuthFailuresTotal.inc();
        console.error('JWT Verification Error:', {
          error: error.message,
          code: error.code,
          tenantId: tenant.id,
          expectedIssuer: tenant.idp.issuer,
          expectedAudience: tenant.idp.audience,
        });
        throw new UnauthorizedException("Invalid or expired JWT");

      }
  }
}