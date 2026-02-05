export interface Tenant{

    id:string;
    name:string;

    idp:{
        issuer:string;
        jwksUri:string;
        audience:string;
    };

    allowedRoutes:string[];

    rateLimit:{
        windowSeconds:60,
        maxRequests:100
    }
}