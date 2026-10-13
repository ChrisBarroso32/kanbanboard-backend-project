import { IsEnum, IsOptional } from 'class-validator';
import { TaskPriority } from '../../../generated/prisma/enums';

export class QueryTaskDto {
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
