import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TaskArchiveService } from '../services/task-archive.service';

@Controller('tasks')
export class TaskArchiveController {
  constructor(private readonly archiveService: TaskArchiveService) {}

  @Post('archive')
  @HttpCode(HttpStatus.OK)
  archive() {
    return this.archiveService.archive();
  }

  @Get('archived')
  findAll() {
    return this.archiveService.findAll();
  }

  @Get('archived/export')
  export() {
    return this.archiveService.exportXlsx();
  }
}
