import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";


@Injectable()
export class Jwtguard implements CanActivate{
  canActivate(context: ExecutionContext): boolean {
      const req =context.switchToHttp().getRequest<Request>();

      const authHeader =req.headers['authorization'];

      if (!authHeader){
        throw new UnauthorizedException('Missing auth header')
      }

      if (!authHeader.startsWith('Bearer ')){
        throw new UnauthorizedException('Invalid auth')
      }

      const token =authHeader.slice(7);

      if (!token){
        throw new UnauthorizedException('Missing Jwt')
      }

      //add JWT validations
      return true;
  }
}