import { IsEnum, IsInt, Min } from 'class-validator';
import { TaskStatus } from '../../../generated/prisma/enums';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  @Min(0)
  newOrderIndex: number;
}
