import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../database/prisma.service';

// Built from the injected PrismaService (see AuthModule.forRootAsync in
// AppModule) so Better Auth shares the app's single Prisma connection.
export function createAuth(prisma: PrismaService) {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') ?? [],
  });
}

export type Auth = ReturnType<typeof createAuth>;
