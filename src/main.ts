import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './lib/config/env.validation';
import { setupSwagger } from './lib/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);
  app.setGlobalPrefix('api');
  setupSwagger(app);
  await app.listen(config.get('PORT', { infer: true }));
}
void bootstrap();
