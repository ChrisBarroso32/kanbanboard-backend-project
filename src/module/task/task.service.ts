import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, Task } from '../../generated/prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './task.repository';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  findAll(query: QueryTaskDto): Promise<Task[]> {
    return this.taskRepository.findMany(query.priority);
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.withPrismaErrors(this.taskRepository.create(dto));
  }

  update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return this.withPrismaErrors(this.taskRepository.update(id, dto), id);
  }

  async move(id: string, dto: MoveTaskDto): Promise<Task> {
    const task = await this.withPrismaErrors(
      this.taskRepository.move(id, dto.status, dto.newOrderIndex),
    );
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async remove(id: string): Promise<void> {
    const task = await this.withPrismaErrors(this.taskRepository.delete(id));
    if (!task) throw new NotFoundException(`Task ${id} not found`);
  }

  // P2025: record not found (e.g. deleted between requests)
  // P2034: serializable transaction aborted by a concurrent write, client should retry
  // P2028: transaction could not start or exceeded TX_OPTIONS maxWait/timeout
  private async withPrismaErrors<T>(
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
}
