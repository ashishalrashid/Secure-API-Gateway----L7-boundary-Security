import { Request, Response , NextFunction } from "express"
import { logger } from "./logger";

export function requestlogger(
    req:Request,
    res: Response,
    next:NextFunction,
){
    const start =Date.now();

    res.on('finish',()=>{
        logger.info({
            plane:'data',
            method:req.method,
            path:req.originalUrl,
            status:res.statusCode,
            durationMs:Date.now()-start,
        });
    });

    next();
}