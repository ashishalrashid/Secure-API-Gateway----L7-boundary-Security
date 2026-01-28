import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";



@Injectable()
export class ApiKeyGuard implements CanActivate{
  canActivate(context: ExecutionContext): boolean {
    const req =context.switchToHttp().getRequest<Request>();

    const apiKey =req.headers['x-api-key'];

    if (!apiKey){
      throw new UnauthorizedException('Missing API key')
    }

    if (apiKey!=='test-api-key'){
      throw new UnauthorizedException("Invalid API key")
    }

    return true;
  } 
      
}
