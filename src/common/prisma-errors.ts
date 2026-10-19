import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

// P2025: record not found (e.g. deleted between requests)
// P2034: serializable transaction aborted by a concurrent write, client should retry
// P2028: transaction could not start or exceeded TX_OPTIONS maxWait/timeout
export async function withPrismaErrors<T>(
  operation: Promise<T>,
  id?: string,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          throw new NotFoundException(`Task ${id} not found`);
        case 'P2034':
          throw new ConflictException(
            'Task order changed concurrently, please retry',
          );
        case 'P2028':
          throw new ServiceUnavailableException(
            'Database is busy, please retry',
          );
      }
    }
    throw error;
  }
}
