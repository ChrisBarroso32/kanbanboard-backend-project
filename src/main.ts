import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Better Auth needs the raw body; AuthModule re-adds parsers for other routes.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // AuthModule excludes its own basePath (/api/auth) from this prefix.
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
