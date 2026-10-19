import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { EnvironmentVariables } from '../config/env.validation';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Explicit @Inject: prisma/seed.ts runs under tsx (esbuild), which does not
  // emit decorator metadata, so type-based injection would resolve undefined.
  constructor(
    @Inject(ConfigService) config: ConfigService<EnvironmentVariables, true>,
  ) {
    const connectionString = config.get('DATABASE_URL', { infer: true });
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit() {
    await this.$connect();
    // $connect does not open a pg connection with the driver adapter; this
    // warms the pool so the first request does not pay the TLS handshake.
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
