import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class AdminGuard implements CanActivate{
    canActivate(context: ExecutionContext): boolean {
        const req =context.switchToHttp().getRequest<Request>();
        const token =req.headers['x-admin-token'];

        if (!token||token !==process.env.ADMIN_TOKEN){
            throw new UnauthorizedException('Invalid admin token');
        }

        return true;
    }
}