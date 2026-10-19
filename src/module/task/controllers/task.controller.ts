import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { MoveTaskDto } from '../dto/move-task.dto';
import { QueryTaskDto } from '../dto/query-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskService } from '../services/task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findAll(@Query() query: QueryTaskDto) {
    return this.taskService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.taskService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Patch(':id/move')
  move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto) {
    return this.taskService.move(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.remove(id);
  }
}
