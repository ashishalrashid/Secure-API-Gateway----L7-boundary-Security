import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { createRemoteJWKSet,jwtVerify } from 'jose';
import { Subject } from "rxjs";

const jwks= createRemoteJWKSet(
  new URL(process.env.IDP_JWKS_URI!)
);

@Injectable()
export class Jwtguard implements CanActivate{
  async canActivate(context: ExecutionContext): Promise<boolean> {
      const req =context.switchToHttp().getRequest<Request>();

      const auth =req.headers['authorization'];

      if (!auth|| auth.startsWith('Bearer ')){
        throw new UnauthorizedException('Missing authorization')
      }

      const token =auth.slice(7); 
      try{
        const {payload}= await jwtVerify(token,jwks,{
          issuer:process.env.IDP_ISSUER,
          audience:process.env.IDP_AUDIENCE,
        });
        (req as any).identity ={
          subject:payload.sub,
          tenantId:payload.tenant_id,
          claims: payload,
        };
        return true;

      }catch(err){
        throw new UnauthorizedException('Invalid JWT');
      }

  }
}