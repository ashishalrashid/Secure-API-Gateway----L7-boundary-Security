import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config'
import { requestlogger } from './common/logger/logger.middleware';
import { requestMetrics } from './common/metrics/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // console.log('ISSUER:', process.env.IDP_ISSUER);
  // console.log('JWKS:', process.env.IDP_JWKS_URI);
  // console.log('AUD:', process.env.IDP_AUDIENCE);

  //CORS
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, backend, SDKs)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Token",
      "X-API-Key",
    ],
  });

  //middlware logging
  app.use(requestlogger);
  app.use(requestMetrics);



  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
