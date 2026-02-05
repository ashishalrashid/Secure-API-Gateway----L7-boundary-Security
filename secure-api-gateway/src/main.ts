import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config'
import { requestlogger } from './common/logger/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // console.log('ISSUER:', process.env.IDP_ISSUER);
  // console.log('JWKS:', process.env.IDP_JWKS_URI);
  // console.log('AUD:', process.env.IDP_AUDIENCE);

  //middlware logging
  app.use(requestlogger);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
