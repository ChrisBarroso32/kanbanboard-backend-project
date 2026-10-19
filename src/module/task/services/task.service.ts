import { Injectable, NotFoundException } from '@nestjs/common';
import { withPrismaErrors } from '../../../common/prisma-errors';
import { Task } from '../../../generated/prisma/client';
import { CreateTaskDto } from '../dto/create-task.dto';
import { MoveTaskDto } from '../dto/move-task.dto';
import { QueryTaskDto } from '../dto/query-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskRepository } from '../repositories/task.repository';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  findAll(query: QueryTaskDto): Promise<Task[]> {
    return this.taskRepository.findMany(query.priority);
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return withPrismaErrors(this.taskRepository.create(dto));
  }

  update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return withPrismaErrors(this.taskRepository.update(id, dto), id);
  }

  async move(id: string, dto: MoveTaskDto): Promise<Task> {
    const task = await withPrismaErrors(
      this.taskRepository.move(id, dto.status, dto.newOrderIndex),
    );
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async remove(id: string): Promise<void> {
    const task = await withPrismaErrors(this.taskRepository.delete(id));
    if (!task) throw new NotFoundException(`Task ${id} not found`);
  }
}
