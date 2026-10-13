import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

// AuthGuard is also registered globally by AuthModule; it is declared here
// explicitly so these routes stay protected even if that default changes.
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Must be declared before ':id' so "all" is not captured as an id.
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return this.userService.getProfile(session.user.id);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }

  @Patch(':id')
  updateProfile(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: UpdateUserDto,
  ) {
    if (id !== session.user.id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.userService.updateProfile(session.user.id, dto);
  }
}
