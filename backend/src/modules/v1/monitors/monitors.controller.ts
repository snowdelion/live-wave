import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiExtraModels } from '@nestjs/swagger'
import { seconds, Throttle } from '@nestjs/throttler'

import { UserId } from '@/shared/decorators/user-id.decorator'

import { MonitorsDocs } from './decorators/monitors-docs.decorator'
import { MONITORS_EXTRA_MODELS } from './dto/monitors-extra-models'
import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'
import {
  createMonitorDocs,
  deleteMonitorDocs,
  findByUserIdDocs,
  findMonitorByIdDocs,
  updateMonitorDocs,
} from './monitors.docs'
import { MonitorsService } from './monitors.service'

@ApiExtraModels(...MONITORS_EXTRA_MODELS)
@Controller('monitors')
export class MonitorsController {
  constructor(private monitorsService: MonitorsService) {}

  @Post()
  @MonitorsDocs(createMonitorDocs)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @UseGuards(AuthGuard('jwt'))
  async create(
    @UserId() userId: string,
    @Body()
    dto: CreateMonitorDto,
  ) {
    return await this.monitorsService.create(userId, dto)
  }

  @Get(':id')
  @MonitorsDocs(findMonitorByIdDocs)
  @UseGuards(AuthGuard('jwt'))
  async findById(@UserId() userId: string, @Param('id') id: string) {
    return await this.monitorsService.findById(userId, id)
  }

  @Get()
  @MonitorsDocs(findByUserIdDocs)
  @UseGuards(AuthGuard('jwt'))
  async findAllByUserId(@UserId() userId: string) {
    return await this.monitorsService.findAllByUserId(userId)
  }

  @Patch(':id')
  @MonitorsDocs(updateMonitorDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @UseGuards(AuthGuard('jwt'))
  async update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateMonitorDto) {
    return await this.monitorsService.update(userId, id, dto)
  }

  @Delete(':id')
  @MonitorsDocs(deleteMonitorDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async delete(@UserId() userId: string, @Param('id') id: string) {
    await this.monitorsService.delete(userId, id)
  }
}
