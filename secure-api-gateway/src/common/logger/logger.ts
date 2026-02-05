import pino from 'pino';

export const logger =pino({
    level:process.env.LOG_LEVEL ||'info',
    base:{
        Service: 'api-gateway',
    },
    timestamp: ()=>`"ts":"${new Date().toISOString()}"`,
});