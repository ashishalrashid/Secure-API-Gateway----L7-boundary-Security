import { Request, Response, NextFunction } from "express";
import { gatewayRequestsTotal,gatewayLatencyMs,gatewayInflightRequests } from "./metrics";

export function requestMetrics(req:Request,res:Response, next:NextFunction){
    const start =Date.now();

    gatewayInflightRequests.inc();

    res.on('finish',()=>{gatewayInflightRequests.dec();

    const tenantId =(req as any).tenantId || 'unknown';
    const status =String(res.statusCode);

    gatewayRequestsTotal.inc({tenantId,status});
    
    gatewayLatencyMs.observe({tenantId,status},Date.now()-start,);
    });

    next();
}