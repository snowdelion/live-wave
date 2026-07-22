import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { seconds, Throttle } from '@nestjs/throttler'

import { UserId } from '@/shared/decorators/user-id.decorator'

import { UsersDocs } from './decorators/users-docs.decorator'
import { deleteDocs, getMeDocs } from './users.docs'
import { UsersService } from './users.service'

@Controller('v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UsersDocs(getMeDocs)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getMe(@UserId() userId: string) {
    return this.usersService.getMe(userId)
  }

  @Delete('me')
  @UsersDocs(deleteDocs)
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User not found')
    await this.usersService.delete(userId)
  }
}
