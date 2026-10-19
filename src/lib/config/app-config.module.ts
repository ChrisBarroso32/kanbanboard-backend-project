import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

// isGlobal makes ConfigService injectable everywhere, like the other
// infrastructure modules; .env is loaded and validated once at bootstrap.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
  ],
})
export class AppConfigModule {}
