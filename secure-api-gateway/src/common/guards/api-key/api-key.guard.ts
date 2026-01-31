import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { TenantService } from "src/common/tenant/tenant.service";



@Injectable()
export class ApiKeyGuard implements CanActivate{

  constructor(private TenantService:TenantService){}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('API KEY GUARD HIT');
    const req =context.switchToHttp().getRequest<Request>();

    const apiKey =req.headers['x-api-key'];

    console.log('API Key check - apiKey present:', !!apiKey);

    if (!apiKey  || typeof apiKey!=='string'){
      throw new UnauthorizedException('Missing API key')
    }

    const tenant=await this.TenantService.findByApiKey(apiKey);

    console.log('Tenant found:', !!tenant);

    if (!tenant){
      throw new UnauthorizedException("Invalid API key")
    }

    (req as any).tenant =tenant;
    return true;
  } 
      
}
