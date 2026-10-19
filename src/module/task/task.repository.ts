import { Injectable } from '@nestjs/common';
import { Prisma, Task } from '../../generated/prisma/client';
import { TaskPriority, TaskStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../lib/database/prisma.service';

export type CreateTaskData = Pick<
  Prisma.TaskCreateInput,
  'title' | 'description' | 'status' | 'priority'
>;
export type UpdateTaskData = Pick<
  Prisma.TaskUpdateInput,
  'title' | 'description' | 'priority'
>;

// Reindexing reads then writes sibling rows; Serializable makes concurrent
// moves fail (P2034) instead of leaving duplicated or missing indexes.
// maxWait/timeout are above Prisma's defaults (2s/5s): with a remote database,
// opening a new TLS connection can exceed 2s and fail with P2028.
const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 15_000,
};

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(priority?: TaskPriority): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { priority },
      orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  /** Creates the task at the end of its status column. */
  create(data: CreateTaskData): Promise<Task> {
    return this.prisma.$transaction(async (tx) => {
      const status = data.status ?? TaskStatus.BACKLOG;
      const { _max } = await tx.task.aggregate({
        where: { status },
        _max: { orderIndex: true },
      });
      return tx.task.create({
        data: { ...data, status, orderIndex: (_max.orderIndex ?? -1) + 1 },
      });
    }, TX_OPTIONS);
  }

  update(id: string, data: UpdateTaskData): Promise<Task> {
    return this.prisma.task.update({ where: { id }, data });
  }

  /**
   * Moves a task to `status` at `newOrderIndex` (clamped to the end of the
   * target column) and shifts its siblings so both columns stay contiguous.
   * Returns null when the task does not exist.
   */
  move(
    id: string,
    status: TaskStatus,
    newOrderIndex: number,
  ): Promise<Task | null> {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id } });
      if (!task) return null;

      const targetCount = await tx.task.count({
        where: { status, id: { not: id } },
      });
      const newIndex = Math.min(newOrderIndex, targetCount);
      const oldIndex = task.orderIndex;

      if (task.status === status) {
        if (newIndex < oldIndex) {
          await tx.task.updateMany({
            where: { status, orderIndex: { gte: newIndex, lt: oldIndex } },
            data: { orderIndex: { increment: 1 } },
          });
        } else if (newIndex > oldIndex) {
          await tx.task.updateMany({
            where: { status, orderIndex: { gt: oldIndex, lte: newIndex } },
            data: { orderIndex: { decrement: 1 } },
          });
        }
      } else {
        await tx.task.updateMany({
          where: { status: task.status, orderIndex: { gt: oldIndex } },
          data: { orderIndex: { decrement: 1 } },
        });
        await tx.task.updateMany({
          where: { status, orderIndex: { gte: newIndex } },
          data: { orderIndex: { increment: 1 } },
        });
      }

      return tx.task.update({
        where: { id },
        data: { status, orderIndex: newIndex },
      });
    }, TX_OPTIONS);
  }

  /**
   * Deletes a task and shifts the tasks below it up so its column stays
   * contiguous. Returns null when the task does not exist.
   */
  delete(id: string): Promise<Task | null> {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id } });
      if (!task) return null;

      await tx.task.delete({ where: { id } });
      await tx.task.updateMany({
        where: { status: task.status, orderIndex: { gt: task.orderIndex } },
        data: { orderIndex: { decrement: 1 } },
      });
      return task;
    }, TX_OPTIONS);
  }
}
