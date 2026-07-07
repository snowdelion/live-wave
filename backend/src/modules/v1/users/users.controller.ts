import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'

import { UsersDocs } from './decorators/users-docs.decorator'
import { deleteDocs } from './users.docs'
import { UsersService } from './users.service'

@Controller('v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Delete('me')
  @UsersDocs(deleteDocs)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: Request) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('User not found')
    await this.usersService.delete(userId)
  }
}
