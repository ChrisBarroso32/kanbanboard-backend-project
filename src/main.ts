import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './lib/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
