import { Module } from '@nestjs/common';
import { TaskArchiveController } from './controllers/task-archive.controller';
import { TaskArchiveRepository } from './repositories/task-archive.repository';
import { TaskArchiveService } from './services/task-archive.service';
import { TaskController } from './controllers/task.controller';
import { TaskRepository } from './repositories/task.repository';
import { TaskService } from './services/task.service';

@Module({
  controllers: [TaskArchiveController, TaskController],
  providers: [
    TaskService,
    TaskRepository,
    TaskArchiveService,
    TaskArchiveRepository,
  ],
})
export class TaskModule {}
