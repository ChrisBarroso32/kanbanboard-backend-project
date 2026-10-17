import {
  ConflictException,
  Injectable,
  NotFoundException,
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
    return this.withConflictHandling(this.taskRepository.create(dto));
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOrFail(id);
    return this.taskRepository.update(id, dto);
  }

  async move(id: string, dto: MoveTaskDto): Promise<Task> {
    const task = await this.withConflictHandling(
      this.taskRepository.move(id, dto.status, dto.newOrderIndex),
    );
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async remove(id: string): Promise<void> {
    const task = await this.withConflictHandling(
      this.taskRepository.delete(id),
    );
    if (!task) throw new NotFoundException(`Task ${id} not found`);
  }

  private async findOrFail(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  // P2034: serializable transaction aborted by a concurrent write, client should retry
  private async withConflictHandling<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Task order changed concurrently, please retry',
        );
      }
      throw error;
    }
  }
}
