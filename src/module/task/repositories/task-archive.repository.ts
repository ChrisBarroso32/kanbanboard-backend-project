import { Injectable } from '@nestjs/common';
import { ArchivedTask } from '../../../generated/prisma/client';
import { TaskStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../lib/database/prisma.service';
import { TX_OPTIONS } from '../../../lib/database/transaction.options';

@Injectable()
export class TaskArchiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(): Promise<ArchivedTask[]> {
    return this.prisma.archivedTask.findMany({
      orderBy: { archivedAt: 'desc' },
    });
  }

  /**
   * Moves every DONE task to archived_tasks (same UUID) and returns how many
   * were moved. Serializable: a task moved to DONE concurrently aborts the
   * transaction (P2034) instead of being lost.
   */
  archiveDone(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const done = await tx.task.findMany({
        where: { status: TaskStatus.DONE },
      });
      if (done.length === 0) return 0;

      await tx.archivedTask.createMany({
        data: done.map(({ id, title, description, createdAt, updatedAt }) => ({
          id,
          title,
          description,
          createdAt,
          updatedAt,
        })),
      });
      // Delete by id (not by status) to remove exactly what was copied.
      await tx.task.deleteMany({
        where: { id: { in: done.map((t) => t.id) } },
      });
      return done.length;
    }, TX_OPTIONS);
  }
}
