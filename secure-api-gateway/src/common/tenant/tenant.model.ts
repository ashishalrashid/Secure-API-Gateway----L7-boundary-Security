export interface Tenant{

    id:string;
    name:string;

    apiKey:string;

    idp:{
        issuer:string;
        jwksUri:string;
        audience:string;
    };

    allowedRoutes:string[];
}